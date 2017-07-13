import { Linking } from 'react-native';
import queryString from 'query-string';
import SafariView from 'react-native-safari-view';
import uuid from 'uuid';
import URL from 'url-parse';
import URLSearchParams from 'url-search-params';

class Google {
    static defaultProps = {
        clientId: '[YOUR_CLIENT_ID]',
        redirectUri: '[REVERSE_URL_VERSION_OF_CLIENT_ID]://',
        responseType: 'code',
        scopes: ['userinfo.profile']
    }

    constructor(props) {
        this.props = {...Google.defaultProps, ...props}
        this.props.scopes = new Set(this.props.scopes);

        this._verification_string = uuid.v1();
        this._code_verifier = `${uuid.v4()}-${uuid.v4()}`;
        this._verified = false;
        this._access_token = '';
        this._refresh_token = '';
        this._permissions = new Set();
        this._token_expiration = Date.now();
    }

    get verified() {
        return this._verified;
    }

    get permissions() {
        return Array.from(this._permissions);
    }

    isTokenExpired = () => {
        return this._token_expiration <= Date.now();
    }

    getAuthorization = async (scopes = []) => {
        for (const scope_type of scopes) {
            this.props.scopes.add(scope_type);
        }

        const oauthParams = {
            client_id: this.props.clientId,
            redirect_uri: this.props.redirectUri,
            response_type: this.props.responseType,
            state: this._verification_string,
            code_challenge_method: 'plain',
            code_challenge: this._code_verifier,
            scope: Array.from(this.props.scopes).map(scope => 'https://www.googleapis.com/auth/' + scope).join(' ')
        };

        try {
            const oauth_request_return_url = await new Promise((res, rej) => {
                const url_listener = (event) => {
                    const url_test = new RegExp(`^${this.props.redirectUri}`);
                    if (event.url && url_test.test(event.url)) {
                        Linking.removeEventListener('url', url_listener);
                        SafariView.removeEventListener(cancel_listener);
                        res(event.url);
                    }
                }

                const cancel_listener = (event) => {
                    SafariView.removeEventListener(cancel_listener);
                    rej('USER_CANCELED');
                }

                Linking.addEventListener('url', url_listener)
                SafariView.addEventListener('onDismiss', cancel_listener);

                SafariView.show({
                  url: `https://accounts.google.com/o/oauth2/v2/auth?${queryString.stringify(oauthParams)}`
                });
            });

            SafariView.dismiss();

            const login_result = await this._getAccessToken(oauth_request_return_url);
            return login_result;
        } catch(err) {
            console.warn(err);
            return {
                status: 'FAILED',
                reason: err.toString ? err.toString() : 'UNKNOWN'
            };
        }
    }

    _getAccessToken = async (url = '') => {
        if (url) {
            const url_obj = new URL(url);
            const params = new URLSearchParams(url_obj.query);

            if (params.has('code')) {
                try {
                    const accessTokenParams = {
                        client_id: this.props.clientId,
                        redirect_uri: this.props.redirectUri,
                        code: params.get('code'),
                        grant_type: 'authorization_code',
                        code_verifier: this._code_verifier
                    };

                    const access_token_response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
                        method: 'POST',
                        headers: new Headers({'content-type': 'application/x-www-form-urlencoded'}),
                        body: queryString.stringify(accessTokenParams)
                    });

                    if (access_token_response.ok) {
                        const access_token = await access_token_response.json();
                        this._access_token = access_token.access_token;
                        this._refresh_token = access_token.refresh_token;
                        this._id_token = access_token.id_token;
                        this._token_expiration = Date.now() + (access_token.expires_in * 1000);
                        this._verified = true;

                        return { status: 'SUCCESS' };
                    }
                } catch(err) {
                    console.error(err);
                    return {
                        status: 'FAILED',
                        reason: err.toString ? err.toString() : 'UNKNOWN'
                    }
                }
            }
        }

        return {
            status: 'FAILED',
            reason: 'BAD_URL'
        };
    }

    _refreshToken = async () => {
        try {
            const refreshTokenParams = {
                refresh_token: this._refresh_token,
                client_id: this.props.clientId,
                grant_type: 'refresh_token'
            };

            const refresh_token_response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
                method: 'POST',
                headers: new Headers({'content-type': 'application/x-www-form-urlencoded'}),
                body: queryString.stringify(refreshTokenParams)
            });

            if (refresh_token_response.ok) {
                const refresh_token = await refresh_token_response.json();
                this._access_token = refresh_token.access_token;
                this._token_expiration = Date.now() + (refresh_token.expires_in * 1000);

                return true;
            }
        } catch(err) {
            console.error(err);
        }

        return false;
    }
}

export default Google;
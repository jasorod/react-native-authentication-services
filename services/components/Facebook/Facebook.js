import { Linking } from 'react-native';
import queryString from 'query-string';
import SafariView from 'react-native-safari-view';
import uuid from 'uuid';
import URL from 'url-parse';
import URLSearchParams from 'url-search-params';

class Facebook {
    static defaultProps = {
        clientId: '[YOUR_CLIENT_ID]',
        clientSecret: '[YOUR_CLIENT_SECRET]',
        redirectUri: 'fb[YOUR_CLIENT_ID]://authorize/',
        responseType: 'code,granted_scopes',
        scopes: ['public_profile']
    }

    constructor(props) {
        this.props = {...Facebook.defaultProps, ...props}
        this.props.scopes = new Set(this.props.scopes);

        this._verification_string = uuid.v1();
        this._verified = false;
        this._access_token = '';
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
            scope: Array.from(this.props.scopes).join(','),
            auth_type: 'rerequest'
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

                Linking.addEventListener('url', url_listener);
                SafariView.addEventListener('onDismiss', cancel_listener);
                
                SafariView.show({
                  url: `https://www.facebook.com/v2.9/dialog/oauth?${queryString.stringify(oauthParams)}`
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

            if (params.has('granted_scopes')) {
                this._permissions = new Set(params.get('granted_scopes').split(','));
            }

            if (params.has('code')) {
                try {
                    const accessTokenParams = {
                        client_id: this.props.clientId,
                        redirect_uri: this.props.redirectUri,
                        client_secret: this.props.clientSecret,
                        code: params.get('code')
                    };

                    const access_token_response = await fetch(`https://graph.facebook.com/v2.9/oauth/access_token?${queryString.stringify(accessTokenParams)}`);

                    if (access_token_response.ok) {
                        const access_token = await access_token_response.json();
                        this._access_token = access_token.access_token;
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
}

export default Facebook;
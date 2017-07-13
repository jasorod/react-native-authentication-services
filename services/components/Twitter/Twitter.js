import { Linking } from 'react-native';
import SafariView from 'react-native-safari-view';
import URLSearchParams from 'url-search-params';
import CryptoJS from 'crypto-js';
import OAuth from 'oauth-1.0a';
import URL from 'url-parse';

class Twitter {
    static defaultProps = {
        consumerKey: '[YOUR_CONSUMER_KEY]',
        consumerSecret: '[YOUR_CONSUMER_SECRET]',
        authUrl: 'https://api.twitter.com/oauth/request_token',
        accessUrl: 'https://api.twitter.com/oauth/access_token',
        oauthCallback: '[APP_BUNDLE_NAME]://authorization'
    }

    constructor(props) {
        this.props = {...Twitter.defaultProps, ...props};

        this._oauth_request_token = '';
        this._oauth_request_token_secret = '';
        this._oauth_request_return_url = '';
        this._oauth_access_token = '';
        this._oauth_access_token_secret = '';
        this._user_id = '';
        this._screen_name = '';
        this._oauth_request = null;
        this._verified = false;
    }

    get verified() {
        return this._verified;
    }

    static _hash_function = (base_string, key) => {
        let hash = CryptoJS.HmacSHA1(base_string, key)
        return hash.toString(CryptoJS.enc.Base64);
    }

    getAuthorization = async () => {
        const twitter_oauth = OAuth({
            consumer: {
                key: this.props.consumerKey,
                secret: this.props.consumerSecret
            },
            signature_method: 'HMAC-SHA1',
            hash_function: Twitter._hash_function
        });

        const twitter_request_data = {
            url: this.props.authUrl,
            method: 'POST',
            data: {
                oauth_callback: this.props.oauthCallback
            }
        }

        try {
            const response = await fetch(this.props.authUrl, {
                method: 'POST',
                headers: twitter_oauth.toHeader(twitter_oauth.authorize(twitter_request_data))
            });

            if (response) {
                const response_body = await response.text();
                const params = new URLSearchParams(response_body);
                this._oauth_request_token = params.get('oauth_token');
                this._oauth_request_token_secret = params.get('oauth_token_secret');

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
                        url: `https://api.twitter.com/oauth/authenticate?oauth_token=${this._oauth_request_token}`
                    });
                });

                SafariView.dismiss();

                const login_result = await this._getAccessToken(oauth_request_return_url);
                return login_result;
            }
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
            try {
                url = new URL(url);
                const params = new URLSearchParams(url.query);

                const twitter_oauth = OAuth({
                    consumer: {
                        key: this.props.consumerKey,
                        secret: this.props.consumerSecret
                    },
                    signature_method: 'HMAC-SHA1',
                    hash_function: Twitter._hash_function
                });

                const twitter_request_data = {
                    url: this.props.accessUrl,
                    method: 'POST',
                    data: {
                        oauth_verifier: params.get('oauth_verifier')
                    }
                }

                const twitter_token = {
                    key: this._oauth_request_token,
                    secret: this._oauth_request_token_secret
                }

                const response = await fetch(this.props.accessUrl, {
                    method: 'POST',
                    headers: twitter_oauth.toHeader(twitter_oauth.authorize(twitter_request_data, twitter_token)),
                });

                if (response.ok) {
                    let response_text = await response.text();
                    let params = new URLSearchParams(response_text);
                    this._oauth_access_token = params.get('oauth_token');
                    this._oauth_access_token_secret = params.get('oauth_secret');
                    this._screen_name = params.get('screen_name');
                    this._user_id = params.get('user_id');
                    this._verified = true;

                    return this._verified;
                }
            } catch(err) {
                console.error(err);
                return {
                    status: 'FAILED',
                    reason: err.toString ? err.toString() : 'UNKNOWN'
                };
            }
        }

        return {
            status: 'FAILED',
            reason: 'BAD_URL'
        };
    }
}

export default Twitter;
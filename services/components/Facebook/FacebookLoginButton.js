import React from 'react';
import { View, Image, Text, TouchableHighlight } from 'react-native';
import Facebook from './Facebook.js';
import EStyleSheet from 'react-native-extended-stylesheet';

class FacebookLoginButton extends React.Component {
    static defaultProps = {
        underlayColor: '#fff'
    }

    state = {
        buttonText: 'Sign in with Facebook',
        status: 'unsubmitted',
        login: false
    }

    constructor(props) {
        super(props);

        this._facebook_login = new Facebook();
    }

    _login = async () => {
        this.setState({
            buttonText: 'Processing...',
            status: 'submitting'
        });

        const login_status = await this._facebook_login.getAuthorization();
        if (login_status.status === 'SUCCESS') {
            this.setState({
                buttonText: 'Logged in',
                status: 'submitted',
                login: true
            });
        } else if (login_status.reason === 'USER_CANCELED') {
            this.setState({
                buttonText: 'Sign in with Facebook',
                status: 'unsubmitted',
                login: false
            });
        } else {
            alert('Unable to connect to Facebooke login, please try again or use another sign-in method');
            this.setState({
                buttonText: 'Sign in with Facebook',
                status: 'unsubmitted',
                login: false
            });
        }
    }

    render() {
        return (
            <TouchableHighlight onPress={this._login} activeOpacity={.8} underlayColor={this.props.underlayColor}>
                <View style={styles.buttonView}>
                    <View style={styles.iconWrapper}>
                        <Image source={require('./img/fb_logo_blue.png')} style={styles.icon}></Image>
                    </View>
                    <Text style={styles.text}>{this.state.buttonText}</Text>
                    <View/>
                </View>
            </TouchableHighlight>
        );
    }
}

const styles = EStyleSheet.create({
    buttonView: {
        width: 250,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#3c5b9b',
        borderWidth: 1,
        borderColor: '#3c5b9b'
    },
    iconWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        backgroundColor: '#fff'
    },
    icon: {
        height: 20,
        aspectRatio: 1,
        margin: 'auto'
    },
    text: {
        fontSize: 14,
        fontFamily: 'HelveticaNeue-Medium',
        color: '#fff',
        textAlign: 'center'
    }
});

export default FacebookLoginButton;
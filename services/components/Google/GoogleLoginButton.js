import React from 'react';
import { View, Image, Text, TouchableHighlight } from 'react-native';
import Google from './Google.js';
import EStyleSheet from 'react-native-extended-stylesheet';

class GoogleLoginButton extends React.Component {
    static defaultProps = {
        underlayColor: '#fff'
    }

    state = {
        buttonText: 'Sign in with Google',
        status: 'unsubmitted',
        login: false
    }

    constructor(props) {
        super(props);

        this._google_login = new Google();
    }

    _login = async () => {
        this.setState({
            buttonText: 'Processing...',
            status: 'submitting'
        });

        const login_status = await this._google_login.getAuthorization();
        if (login_status.status === 'SUCCESS') {
            this.setState({
                buttonText: 'Logged in',
                status: 'submitted',
                login: true
            });
        } else if (login_status.reason === 'USER_CANCELED') {
            this.setState({
                buttonText: 'Sign in with Google',
                status: 'unsubmitted',
                login: false
            });
        } else {
            alert('Unable to connect to Google login, please try again or use another sign-in method');
            this.setState({
                buttonText: 'Sign in with Google',
                status: 'unsubmitted',
                login: false
            });
        }
    }

    render() {
        return (
            <TouchableHighlight onPress={this._login} activeOpacity={.8} underlayColor={this.props.underlayColor}>
                <View style={styles.buttonView}>
                    <Image source={require('./img/google_light_normal.png')} style={styles.icon}/>
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
        paddingRight: 11,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#4285f4',
        borderWidth: 1,
        borderColor: '#4285f4'
    },
    icon: {
        width: 50,
        aspectRatio: 1,
        backgroundColor: '#fff',
        marginRight: 20
    },
    text: {
        fontSize: 14,
        fontFamily: 'HelveticaNeue-Medium',
        color: '#fff'
    }
});

export default GoogleLoginButton;
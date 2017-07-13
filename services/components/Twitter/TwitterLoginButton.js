import React from 'react';
import { View, Image, Text, TouchableHighlight } from 'react-native';
import Twitter from './Twitter.js';
import EStyleSheet from 'react-native-extended-stylesheet';

class TwitterLoginButton extends React.Component {
    static defaultProps = {
        underlayColor: '#fff',
        isAuthorized: (val) => { return false; }
    }
    
    state = {
        buttonText: 'Sign in with Twitter',
        status: 'unsubmitted',
        login: false
    }

    constructor(props) {
        super(props);

        this._twitter_login = new Twitter();
    }

    _login = async () => {
        this.setState({
            buttonText: 'Processing...',
            status: 'submitting'
        });

        const login_status = await this._twitter_login.getAuthorization();
        if (login_status.status === 'SUCCESS') {
            this.setState({
                buttonText: 'Logged in',
                status: 'submitted',
                login: true
            });
        } else if (login_status.reason === 'USER_CANCELED') {
            this.setState({
                buttonText: 'Sign in with Twitter',
                status: 'unsubmitted',
                login: false
            });
        } else {
            alert('Unable to connect to Twitter login, please try again or use another sign-in method');
            this.setState({
                buttonText: 'Sign in with Twitter',
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
                        <Image source={require('./img/twitter_logo_blue.png')} style={styles.icon}></Image>
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
        backgroundColor: '#1da1f2',
        borderWidth: 1,
        borderColor: '#1da1f2'
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
        height: 22,
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

export default TwitterLoginButton;
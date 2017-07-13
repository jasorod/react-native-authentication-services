# react-native-authentication-services
React Native iOS components for authenticating with Google, Facebook, and Twitter via Oauth

Each component consists of a service component along with a React Native button that can be used to trigger the service.  Each service is a class, and each button contains an instance of the service class.  If you wish to separate these two details, then make sure to instantiate the service classes and pass that instance to the button component.

You will need to edit the default properties of each service and add your credentials for sign-in.

Additionally, because this is using Oauth through a SFSafariViewController, you will need to link the react-native-safari-view component with your iOS project.  Along with this process, since it's using the React Native Linking object to get the return url from the Oauth process, you will need to add a url listener to your App delegate object in Xcode, along with registering the proper url paths for your application to listen to.

Once the login process is complete, a series of tokens specific to the service, along with user account information, will be saved as a private variable on the services class.  You can access this variable directly on a class instance, or wrap it inside a getter in your own classes.

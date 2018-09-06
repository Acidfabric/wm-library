import React from "react";
import { Font, KeepAwake } from "expo";
import { StyleSheet, AsyncStorage } from "react-native";
import { StyleProvider, Spinner } from "native-base";
import { createStackNavigator } from "react-navigation";

import getTheme from "./native-base-theme/components";
import CameraScreen from "./src/screens/Camera/Camera";
import StartScreen from "./src/screens/Start/Start";

import helper from './utils/helpers';

const RootStack = createStackNavigator(
  {
    Camera: CameraScreen,
    Start: StartScreen
  },
  {
    initialRouteName: "Start"
  }
);

export default class App extends React.Component {
  state = {
    ready: false,
  }

  async componentWillMount() {
    KeepAwake.activate();
    
    await Font.loadAsync({
      /* eslint-disable global-require */
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("@expo/vector-icons/fonts/Ionicons.ttf")
      /* eslint-enable */
    });
    this.setState({
      ready: true
    });
  }

  async componentDidMount() {
    const response = await this.takeABookForDanas();
    console.log(response);
  }

  async fetchUserAndBooks() {
    const allBooks = await helper.getAllBooks();
    const allUsers = await helper.getAllUsers();
    
    return [allUsers, allBooks];
  }

  async initStorage() {
    const response = await helper.initStorage();
    return response;
  }

  async takeABookForDanas() {
    const response = await helper.manageBook({ bookQr: 1, faceId: 'e28c79f8-106e-44a5-948a-c8ee782a1080' });
    return response;
  }

  render() {
    return (
      <StyleProvider style={getTheme()}>
        {this.state.ready ? <RootStack /> : <Spinner />}
      </StyleProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});

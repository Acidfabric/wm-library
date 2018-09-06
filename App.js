import React from "react";
import { Font, KeepAwake } from "expo";
import { StyleSheet } from "react-native";
import { StyleProvider, Spinner } from "native-base";
import { createStackNavigator } from "react-navigation";

import getTheme from "./native-base-theme/components";
import CameraScreen from "./src/screens/Camera/Camera";
import StartScreen from "./src/screens/Start/Start";

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
    ready: false
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

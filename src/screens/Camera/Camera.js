import React from "react";
import { Button, Container, Content, Text, View } from "native-base";
import { Camera, Permissions, BarCodeScanner } from "expo";

export default class CameraScreen extends React.Component {
  static navigationOptions = {
    title: "Bookifizer"
  };

  state = {
    barcode: "",
    hasCameraPermission: null,
    type: Camera.Constants.Type.back
  };

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === "granted" });
  }

  render() {
    const { hasCameraPermission, showCamera } = this.state;
    let content = null;
    if (hasCameraPermission === null) {
      content = <View />;
    } else if (hasCameraPermission === false) {
      content = <Text>No access to camera</Text>;
    } else {
      return (content = (
        <View style={{ flex: 1 }}>
          {this.state.barcode ? (
            <Camera style={{ flex: 1 }} type={Camera.Constants.Type.front} />
          ) : (
            <BarCodeScanner
              style={{ flex: 1 }}
              type={Camera.Constants.Type.front}
              onBarCodeRead={({ data }) => {
                console.log("Barcode read", data);
                this.setState({
                  barcode: data
                });
              }}
            />
          )}
          {/* <View
              style={{
                flex: 1,
                backgroundColor: "transparent",
                flexDirection: "row"
              }}
            >
              <Button
                style={{
                  flex: 0.1,
                  alignSelf: "flex-end",
                  alignItems: "center"
                }}
                onPress={() => {
                  this.setState({
                    type:
                      this.state.type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                  });
                }}
              >
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: "white" }}
                >
                  {" "}
                  Flip{" "}
                </Text>
              </Button>
            </View> 
          </Camera> */}
        </View>
      ));
    }

    return (
      <Container>
        <Content
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {content}
        </Content>
      </Container>
    );
  }
}

import React from "react";
import { Button, Container, Content, Text } from "native-base";

export default class Start extends React.Component {
  static navigationOptions = {
    title: "Bookifizer"
  };

  render() {
    return (
      <Container>
        <Content
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Button
            block
            onPress={() => {
              this.props.navigation.replace("Camera");
            }}
          >
            <Text>Take Book</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}

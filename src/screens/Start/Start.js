import React from 'react';
import { Button, Container, Content, Text } from 'native-base';
import { ImageBackground, Image } from 'react-native';

const bg = require('../../assets/bg.jpg');
const logo = require('../../assets/logo.png');

export default class Start extends React.Component {
  static navigationOptions = {
    header: null
  };

  render() {
    return (
      <Container>
        <Content contentContainerStyle={{ flex: 1 }}>
          <ImageBackground
            source={bg}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%'
            }}
          >
            <Image source={logo} style={{ width: '50%', height: '50%' }} resizeMode="contain" />
            <Button
              onPress={() => {
                this.props.navigation.push('Camera');
              }}
              style={{
                alignSelf: 'center'
              }}
            >
              <Text>Take / Return</Text>
            </Button>
          </ImageBackground>
        </Content>
      </Container>
    );
  }
}

import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Container,
  Content,
  Text,
  View,
  Form,
  Button,
  Input,
  Item,
  Label,
  Spinner
} from 'native-base';
import { Camera, Permissions, BarCodeScanner, Speech, ImageManipulator } from 'expo';
import throttle from 'lodash.throttle';
import AWS from 'aws-sdk/dist/aws-sdk-react-native';
import Base64 from '../../base64';
import helpers from '../../../utils/helpers';
import { atob } from 'abab'

// Configure the credentials provider to use your identity pool
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:68d408cf-e25a-406f-8a77-cc83e686a2d4'
});
// Make the call to obtain credentials
AWS.config.credentials.get(function() {
  // Credentials will be available when this function is called.
  var accessKeyId = AWS.config.credentials.accessKeyId;
  var secretAccessKey = AWS.config.credentials.secretAccessKey;
  var sessionToken = AWS.config.credentials.sessionToken;
});

function getBinary(base64Image) {
  var binaryImg = atob(base64Image);
  var length = binaryImg.length;
  var ab = new ArrayBuffer(length);
  var ua = new Uint8Array(ab);
  for (var i = 0; i < length; i++) {
    ua[i] = binaryImg.charCodeAt(i);
  }

  return ab;
}

export default class CameraScreen extends React.Component {
  static navigationOptions = {
    header: null
  };

  state = {
    latestPhoto: null,
    register: false,
    faces: [],
    barcode: '',
    processingFaces: false,
    hasCameraPermission: null,
    type: Camera.Constants.Type.back
  };

  snapTimeout = null;

  camera = null;

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });

    Speech.speak('Welcome to Bookifizer. Please scan your book', { rate: 0.9 });
  }

  componentWillUnmount() {
    clearTimeout(this.snapTimeout);
  }

  onFacesDetected = faces => {
    if (this.camera) {
      if (!this.state.processingFaces) {
        this.setState(
          {
            faces,
            processingFaces: true,
            name: '',
            registration: false
          },
          () => {
            // this.camera.getSupportedRatiosAsync().then(ratios => {
            //   console.log('sizes', size);
            // })

            // const signature = getSignatureKey('e1wHxM+ChkP1OE37MjQMewA7aTC6h+fF4RZzj9MC', new Date().toISOString(), 'us-east-1', 'rekognition');
            // console.log('signatures', signature);
            setTimeout(() => {
              this.camera.takePictureAsync().then(photo => {
                console.log('uri', photo.uri);
                this.setState({
                  latestPhoto: photo
                });
                ImageManipulator.manipulate(photo.uri, [{ resize: { height: 500 } }], {
                  base64: true,
                  format: 'jpeg'
                }).then(resized => {
                  const rec = new AWS.Rekognition();
                  // console.log(resized);
                  try {
                    const bytes = getBinary(resized.base64);
                    Speech.speak('Almost there');
                    rec.searchFacesByImage(
                      {
                        CollectionId: 'database',
                        FaceMatchThreshold: 10,
                        MaxFaces: 1,
                        Image: {
                          Bytes: bytes
                        }
                      },
                      (err, data) => {
                        if (err) {
                          this.setState({
                            processingFaces: false
                          });
                          console.log(err, data);
                        } else {
                          console.log('response', data);
                          const faceId = data.FaceMatches.length
                            ? data.FaceMatches[0].Similarity > 75
                              ? data.FaceMatches[0].Face.FaceId
                              : null
                            : null;
                          if (faceId) {
                            console.log('FaceId', faceId);
                            helpers
                              .manageBook({ faceId, bookQr: this.state.barcode })
                              .then(manageResponse => {
                                console.log('manageResponse', manageResponse);
                                Speech.speak(manageResponse.message);
                                this.props.navigation.replace('Start');
                              });
                          } else {
                            Speech.speak(
                              'We cannot find you in the reader list. By the way - your face looks ugly',
                              data
                            );
                            this.setState({
                              register: true
                            });
                          }
                        }
                      }
                    );
                  } catch (err) {
                    console.log('error - retrying', err);
                    this.setState({
                      processingFaces: false
                    });
                  }
                });
              });
            }, 1000);
          }
        );
      } else {
        this.setState({
          faces
        });
      }
    }
  };

  renderFace({ bounds, faceID, rollAngle, yawAngle }) {
    return (
      <View
        key={faceID}
        transform={[
          { perspective: 600 },
          { rotateZ: `${rollAngle.toFixed(0)}deg` },
          { rotateY: `${yawAngle.toFixed(0)}deg` }
        ]}
        style={[
          styles.face,
          {
            ...bounds.size,
            left: bounds.origin.x,
            top: bounds.origin.y
          }
        ]}
      >
        {/* <Text style={styles.faceText}>ID: {faceID}</Text>
        <Text style={styles.faceText}>rollAngle: {rollAngle.toFixed(0)}</Text>
        <Text style={styles.faceText}>yawAngle: {yawAngle.toFixed(0)}</Text> */}
      </View>
    );
  }

  renderFaces = () => {
    return (
      <View style={styles.facesContainer} pointerEvents="none">
        {this.state.faces.map(this.renderFace)}
      </View>
    );
  };

  render() {
    const { hasCameraPermission, barcode, register, loading } = this.state;
    let content = null;
    if (loading) {
      content = <Spinner />;
    } else if (hasCameraPermission === null) {
      content = <View />;
    } else if (hasCameraPermission === false) {
      content = <Text>No access to camera</Text>;
    } else if (register) {
      content = (
        <Form
          style={{
            width: '70%'
          }}
        >
          <Item
            floatingLabel
            style={{
              marginBottom: 10
            }}
          >
            <Label>Name</Label>
            <Input
              onChangeText={name => {
                this.setState({
                  name
                });
              }}
              value={this.state.name}
            />
          </Item>
          <Button
            style={{
              alignSelf: 'center'
            }}
            onPress={() => {
              this.setState({
                loading: true
              });
              // -----------------------
              ImageManipulator.manipulate(
                this.state.latestPhoto.uri,
                [{ resize: { height: 2000 } }],
                {
                  base64: true,
                  format: 'jpeg'
                }
              ).then(resized => {
                try {
                  const bytes = getBinary(resized.base64);
                  Speech.speak('Uploading your face');
                  const rec = new AWS.Rekognition();
                  rec.indexFaces(
                    {
                      CollectionId: 'database',
                      Image: {
                        Bytes: bytes
                      }
                    },
                    (err, data) => {
                      try {
                        console.log('Got new data', data);
                        if (err) {
                          console.log('Got error', err);
                        }

                        const faceId = data.FaceRecords[0].Face.FaceId;
                        console.log('Got new faceId', faceId);
                        helpers
                          .registration({
                            name: this.state.name,
                            faceId
                          })
                          .then(({ success }) => {
                            this.setState({
                              loading: false
                            });
                            if (success) {
                              console.log('Saved', faceId, this.state.name);
                              Speech.speak('Your face is ready');
                              this.props.navigation.replace('Start');
                            } else {
                              Speech.speak('Something went wrong');
                              this.setState({
                                loading: false,
                                name: '',
                                registration: false
                              });
                            }
                          });
                      } catch (err) {
                        Speech.speak('Something went wrong');
                        console.error(err);
                        this.setState({
                          loading: false,
                          name: '',
                          registration: false
                        });
                      }
                    }
                  );
                } catch (error) {
                  Speech.speak('Something went wrong, please try again');
                  this.setState({
                    name: '',
                    registration: false
                  });
                }
              });
              // -----------------------
            }}
          >
            <Text>Register</Text>
          </Button>
        </Form>
      );
    } else {
      const onFacesDetectedThrottled = throttle(this.onFacesDetected, 100);
      return (content = (
        <View style={{ flex: 1 }}>
          {barcode ? (
            <React.Fragment>
              <Camera
                ref={ref => {
                  this.camera = ref;
                }}
                style={{ flex: 1 }}
                type={Camera.Constants.Type.front}
                onFacesDetected={({ faces }) => {
                  onFacesDetectedThrottled(faces);
                }}
              />
              {this.renderFaces()}
            </React.Fragment>
          ) : (
            <BarCodeScanner
              style={{ flex: 1 }}
              type={Camera.Constants.Type.front}
              onBarCodeRead={({ data }) => {
                console.log('Barcode read', data);
                if (data && data.length <= 3 && parseInt(data)) {
                  Speech.speak('Book recognized. Please stay still');
                  this.setState({
                    barcode: data
                  });
                }
              }}
            />
          )}
        </View>
      ));
    }

    return (
      <Container>
        <Content
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {content}
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between'
  },
  noPermissions: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  gallery: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  toggleButton: {
    flex: 0.25,
    height: 40,
    marginHorizontal: 2,
    marginBottom: 10,
    marginTop: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  autoFocusLabel: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  bottomButton: {
    flex: 0.3,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center'
  },
  newPhotosDot: {
    position: 'absolute',
    top: 0,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4630EB'
  },
  options: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    width: 200,
    height: 160,
    backgroundColor: '#000000BA',
    borderRadius: 4,
    padding: 10
  },
  detectors: {
    flex: 0.5,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row'
  },
  pictureQualityLabel: {
    fontSize: 10,
    marginVertical: 3,
    color: 'white'
  },
  pictureSizeContainer: {
    flex: 0.5,
    alignItems: 'center',
    paddingTop: 10
  },
  pictureSizeChooser: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  pictureSizeLabel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  facesContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0
  },
  face: {
    padding: 10,
    borderWidth: 2,
    // borderRadius: 2,
    position: 'absolute',
    borderColor: '#00FF00',
    justifyContent: 'center'
    // backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent'
  },
  row: {
    flexDirection: 'row'
  }
});

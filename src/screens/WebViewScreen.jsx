import React from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Image, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useFocusEffect } from '@react-navigation/native'

const WebViewScreen = ({ route }) => {
  const { url } = route.params;
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../images/circle_arrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Back</Text>
      </View>

     <WebView
        source={{ uri: url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            function hide() {
              const header = document.querySelector('header');
              const footer = document.querySelector('footer');

              if (header) header.style.setProperty('display', 'none', 'important');
              if (footer) footer.style.setProperty('display', 'none', 'important');
            }

            hide();

            setInterval(hide, 100);

            true;
          })();
        `}
      />

    </SafeAreaView>
  );
};

export default WebViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  arrowIcon: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: '81%',
  },
});
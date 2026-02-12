import * as React from 'react';
import { StatusBar, useColorScheme, LogBox, Platform } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme as PaperLightTheme, DarkTheme as PaperDarkTheme } from 'react-native-paper';
import StackNav from "./src/routes/StackNav";
import { StepProvider } from './src/context/StepContext';
import { NotificationsProvider } from './src/context/NotificationContext';
import { ProductProvider } from './src/context/ProductContext';
import { UserProvider } from './src/context/UserContext';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        alert('Nie udało się uzyskać uprawnień do powiadomień push!');
    }
}

LogBox.ignoreLogs([ // Ignorowanie ostrzeżenia dotyczącego defaultProps (ostrzeżenie o przyszłościowym nie wspieraniu tej metody)
    'TextElement: Support for defaultProps will be removed'
]);

export default function App() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const paperTheme = isDark ? PaperDarkTheme : PaperLightTheme;

    const navigationRef = useNavigationContainerRef();

    React.useEffect(() => {
        registerForPushNotificationsAsync();

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.navigateTo === 'Powiadomienia' && navigationRef.isReady()) {
                navigationRef.navigate('DrawerNav', {
                    screen: 'Powiadomienia',
                });
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, []);

    return (
        <UserProvider>
            <NotificationsProvider>
                <ProductProvider>
                    <StepProvider>
                        <StatusBar
                            barStyle={isDark ? 'light-content' : 'dark-content'}
                            backgroundColor={isDark ? '#000' : '#fff'}
                        />
                        <PaperProvider theme={paperTheme}>
                            <NavigationContainer ref={navigationRef}>
                                <StackNav />
                            </NavigationContainer>
                        </PaperProvider>
                    </StepProvider>
                </ProductProvider>
            </NotificationsProvider>
        </UserProvider>
    );
}

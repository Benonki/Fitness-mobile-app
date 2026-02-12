import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import DrawerNav from "./DrawerNav";
import LoginScreen from "../screens/Login";
import RejestracjaScreen from "../screens/Rejestracja";
import OpisTreninguScreen from "../screens/OpisTreningu";
import InformacjaScreen from "../screens/Informacje";
import DodaneProduktyScreen from '../screens/DodaneProdukty';
import PrivateRoute from './PrivateRoute';

const Stack = createNativeStackNavigator();

const GradientHeader = () => (
    <LinearGradient
        colors={['#D726B9', '#FF6070', '#FF9B04']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
    />
);

const StackNav = () => {
    return (
        <Stack.Navigator screenOptions={{headerStyle: { backgroundColor: 'transparent' }}}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerBackground: () => <GradientHeader/>}}/>
            <Stack.Screen name="Rejestracja" component={RejestracjaScreen} options={{ headerBackground: () => <GradientHeader/>, }}/>

            <Stack.Screen name="Opis Treningu" options={{ headerBackground: () => <GradientHeader/>}}>
                {(props) => (
                    <PrivateRoute>
                        <OpisTreninguScreen {...props} />
                    </PrivateRoute>
                )}
            </Stack.Screen>

            <Stack.Screen name="Informacje o Produkcie" options={{ headerBackground: () => <GradientHeader/>}}>
                {(props) => (
                    <PrivateRoute>
                        <InformacjaScreen {...props} />
                    </PrivateRoute>
                )}
            </Stack.Screen>

            <Stack.Screen name="DrawerNav" options={{ headerShown: false }}>
                {(props) => (
                    <PrivateRoute>
                        <DrawerNav {...props} />
                    </PrivateRoute>
                )}
            </Stack.Screen>

            <Stack.Screen name="Dodane Produkty" options={{ headerBackground: () => <GradientHeader/>}}>
                {(props) => (
                    <PrivateRoute>
                        <DodaneProduktyScreen {...props} />
                    </PrivateRoute>
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default StackNav;
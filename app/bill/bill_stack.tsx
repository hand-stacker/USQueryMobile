import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BillInfo from "../bill/[bill_id]";
import '../globals.css';
import BillFYP from "./bill_fyp";
import BillSearch from "./bill_search";

export const BillStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Bill_FYP" component={BillFYP} options={{ headerShown: false }} />
            <Stack.Screen name="Bill_search" component={BillSearch} options={{ headerShown: false }} />
            <Stack.Screen name="Bill_info" component={BillInfo} options={{ headerShown: false }} />
        </Stack.Navigator>
        );
};

const Stack = createNativeStackNavigator();
export default function RootLayout() {
  return (
    <NavigationContainer>
        <BillStack/>
    </NavigationContainer>
  );
}

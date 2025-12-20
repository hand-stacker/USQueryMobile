import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import '../globals.css';
import MemberInfo from "./[membershipId]";
import MemberFYP from "./mem_fyp";

export const MemberStack = () => {
    return (
        <Stack.Navigator>
          <Stack.Screen name = "Mem_FYP" component={MemberFYP} options={{ headerShown: false }} />  
          <Stack.Screen name = "Member_info" component={MemberInfo} options={{ headerShown: false }} />  
        </Stack.Navigator>
        );
};

const Stack = createNativeStackNavigator();
export default function RootLayout() {
  return (
    <NavigationContainer>
      <MemberStack/>
    </NavigationContainer>
  );
}

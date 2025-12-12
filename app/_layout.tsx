import { ApolloProvider } from "@apollo/client/react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { client } from "./api/apollo";
import { BillStack } from "./bill/bill_stack";
import './globals.css';
import MemberFYP from "./member/mem_fyp";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Tabs.Navigator>
            <Tabs.Screen name = "Bill Stack" component={BillStack} options={{ headerShown: false }} />  
            <Tabs.Screen name = "Mem_FYP" component={MemberFYP} options={{ headerShown: false }} />  
          </Tabs.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </ApolloProvider>
  );
}

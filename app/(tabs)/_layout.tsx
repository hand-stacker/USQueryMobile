import { icons } from "@/constants/icons";
import { Tabs } from "expo-router";
import React from 'react';
import { Image, ImageBackground, Text, View } from "react-native";

const TabIcon = ({focused, icon, title} : any) => {
    if(focused){
    return (
        <ImageBackground
            source={icons.icon1} 
            tintColor="#0f0"
            className="flex flex-row w-full flex-1 min-w-[100px] min-h-14 mt-6 justify-center items-center rounded-full overflow-hidden"
        >
        <Image source={icon} tintColor="#151312" className="size-5" />
        <Text
            className="text-secondary text-base font-semibold ml-2">{title}</Text>
    </ImageBackground>);
    }
    else {
        return (<View className="size-full justify-center items-center mt-4 rounded-full">
            <Image source={icon} tintColor="#A8B5DB" className="size-5" />
        </View>);
    }
}

export default function _Layout() {
    return (
    <Tabs
    screenOptions={{
        tabBarShowLabel:false,
        tabBarItemStyle: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center"
        },
        tabBarStyle: {
            backgroundColor: "#0f0d23",
            borderRadius: 8,
            marginBottom: 36,
            marginHorizontal:18,
            height:50,
            position: "absolute",
            overflow: "hidden",
            borderWidth:1,
            borderColor: "#0f0d23"

        }
    }}
    >
        <Tabs.Screen 
        name="bill_fyp"
        options={{
            title: "Bill FYP",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
                <TabIcon
                    focused={focused}
                    icon={icons.icon1}
                    title="Bill FYP"
                />
            )
        }}
        />
        <Tabs.Screen 
        name="mem_fyp"
        options={{
            title: "Rep. FYP",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
                <TabIcon
                    focused={focused}
                    icon={icons.icon1}
                    title="Rep. FYP"
                />
            )
        }}
        />
        <Tabs.Screen 
        name="bill_search"
        options={{
            title: "Bill Search",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
                <TabIcon
                    focused={focused}
                    icon={icons.icon1}
                    title="Bill Search"
                />
            )
        }}
        />
        <Tabs.Screen 
        name="mem_search"
        options={{
            title: "Rep. Search",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
                <TabIcon
                    focused={focused}
                    icon={icons.icon1}
                    title="Rep. Search"
                />
            )
        }}
        />
    </Tabs>
  );
}
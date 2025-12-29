import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';

interface Props {
  data: any[];
  value?: string[];
  placeholder?: string;
  onChange: (vals: string[]) => void;
  maxContainerHeight?: number;
}

const MultiSelectComponent = ({ data, value, placeholder, onChange, maxContainerHeight=150}: Props) => {
  const selected = value ?? [];
  const maxContHeight = useRef(maxContainerHeight ? maxContainerHeight : 150).current;

  const renderItem = (item: any) => {
    return (
      <View style={styles.item}>
        <Text style={styles.itemText}>{item.name}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MultiSelect
        mode="modal"
        style={styles.general}
        containerStyle={[styles.dropdown, styles.general]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        labelField="name"
        valueField="id"
        searchField="name"
        placeholder={placeholder}
        value={selected}
        search={true}
        searchPlaceholder="Search..."
        onChange={item => {onChange(item);}}
        renderItem={renderItem}
        // renderSelectedItem intentionally omitted to avoid duplication/glitches
        alwaysRenderSelectedItem={false}
        visibleSelectedItem={false}
        
      />

      {/* Selected items rendered below in a scrollable list to avoid dropdown modal conflicts */}
      {((selected && selected.length) || (value && value.length)) ? (
        <ScrollView style={[styles.selectedContainer, {maxHeight: maxContHeight}]} nestedScrollEnabled>
          {selected.map((val: string | number) => {
            const item = (data ?? []).find((s: any) => String(s.id) === String(val));
            return (
              <TouchableOpacity key={String(val)} onPress={() => {
                const next = selected.filter(p => String(p) !== String(val));
                if (onChange) onChange(next);
              }}>
                <View style={[styles.general, styles.selectedStyle]}>
                  <Text style={styles.textSelectedStyle}>{item?.name ?? String(val)}</Text>
                  <Ionicons color="white" name="trash" size={17} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
};

export default MultiSelectComponent;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  general : {
    borderRadius: 14,
    backgroundColor: 'white',
    shadowColor: '#000',
    marginTop: 8,
    marginRight: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
  },
  dropdown: {
    height: 400,
  },

  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#c1c1c1ff',
  },
  itemText: {
    flex: 1,
    flexWrap: 'wrap',
    fontSize: 16,
    lineHeight: 20,
    marginRight: 8,
  },
  selectedStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'black',
    marginBottom: 8,
  },
  textSelectedStyle: {
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 6,
    fontSize: 16,
    lineHeight: 20,
    color: 'white',
  },
  selectedContainer: {
    maxHeight: 150,
    marginTop: 8,
    paddingRight: 8,
  },
});
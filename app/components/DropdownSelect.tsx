import React from 'react';
import { StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

interface Props {
    value?: string;
    placeholder?: string;
    onChange: (value : string) => void;
}
  const staticData = [
    { name: 'All States', id: 'All' },
    { name: 'Alabama', id: 'AL' },
    { name: 'Alaska', id: 'AK' },
    { name: 'Arizona', id: 'AZ' },
    { name: 'Arkansas', id: 'AR' },
    { name: 'California', id: 'CA' },
    { name: 'Colorado', id: 'CO' },
    { name: 'Connecticut', id: 'CT' },
    { name: 'Delaware', id: 'DE' },
    { name: 'Florida', id: 'FL' },
    { name: 'Georgia', id: 'GA' },
    { name: 'Hawaii', id: 'HI' },
    { name: 'Idaho', id: 'ID' },
    { name: 'Illinois', id: 'IL' },
    { name: 'Indiana', id: 'IN' },
    { name: 'Iowa', id: 'IA' },
    { name: 'Kansas', id: 'KS' },
    { name: 'Kentucky', id: 'KY' },
    { name: 'Louisiana', id: 'LA' },
    { name: 'Maine', id: 'ME' },
    { name: 'Maryland', id: 'MD' },
    { name: 'Massachusetts', id: 'MA' },
    { name: 'Michigan', id: 'MI' },
    { name: 'Minnesota', id: 'MN' },
    { name: 'Mississippi', id: 'MS' },
    { name: 'Missouri', id: 'MO' },
    { name: 'Montana', id: 'MT' },
    { name: 'Nebraska', id: 'NE' },
    { name: 'Nevada', id: 'NV' },
    { name: 'New Hampshire', id: 'NH' },
    { name: 'New Jersey', id: 'NJ' },
    { name: 'New Mexico', id: 'NM' },
    { name: 'New York', id: 'NY' },
    { name: 'North Carolina', id: 'NC' },
    { name: 'North Dakota', id: 'ND' },
    { name: 'Ohio', id: 'OH' },
    { name: 'Oklahoma', id: 'OK' },
    { name: 'Oregon', id: 'OR' },
    { name: 'Pennsylvania', id: 'PA' },
    { name: 'Rhode Island', id: 'RI' },
    { name: 'South Carolina', id: 'SC' },
    { name: 'South Dakota', id: 'SD' },
    { name: 'Tennessee', id: 'TN' },
    { name: 'Texas', id: 'TX' },
    { name: 'Utah', id: 'UT' },
    { name: 'Vermont', id: 'VT' },
    { name: 'Virginia', id: 'VA' },
    { name: 'Washington', id: 'WA' },
    { name: 'West Virginia', id: 'WV' },
    { name: 'Wisconsin', id: 'WI' },
    { name: 'Wyoming', id: 'WY' },
  ];

  const DropdownSelectComponent = ({value, placeholder, onChange }: Props) => {
    const selected = value ?? 'All';
    return (
      <Dropdown
        mode="modal"
        style={styles.general}
        containerStyle={[styles.dropdown, styles.general]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={staticData}
        search={true}
        labelField="name"
        valueField="id"
        searchField="name"
        placeholder={placeholder}
        searchPlaceholder="Search..."
        value={selected}
        onChange={item => {onChange(item.id);}}
      />
    );
  };

  export default DropdownSelectComponent;

const styles = StyleSheet.create({
    dropdown: {
      margin: 16,
      height: 400,
      borderBottomColor: 'gray',
      borderBottomWidth: 0.5,
    },
    icon: {
      marginRight: 5,
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
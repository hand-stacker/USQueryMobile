import SearchButton from "@/app/components/SearchButton";
import { UnscalableText } from "@/app/components/UnscalableText";
import { ThemeContext } from "@/app/theme/themeContext";
import { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  navigation: any;
  mode: 'FYP' | 'Starred' | 'Search';
  handleOpenModal?: () => void;
}

const BillTopNav = ({ navigation, mode, handleOpenModal }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.leftSpacer} />
      <View style={styles.centerGroup}>
        <Pressable onPress={() => navigation?.navigate('Bill_FYP') } style={styles.navItem}>
          <UnscalableText style={[styles.pageTitle, mode === 'FYP' && styles.activePageTitle]}>For You</UnscalableText>
        </Pressable>
        <Pressable onPress={() => navigation?.navigate('Starred_Bills') } style={styles.navItem}>
          <UnscalableText style={[styles.pageTitle, mode === 'Starred' && styles.activePageTitle]}>Starred</UnscalableText>
        </Pressable>
        <Pressable onPress={() => navigation?.navigate('Searched_Bills') } style={styles.navItem}>
          <UnscalableText style={[styles.pageTitle, mode === 'Search' && styles.activePageTitle]}>Search</UnscalableText>
        </Pressable>
      </View>
      <View style={styles.rightGroup}>
        <SearchButton highlighted={mode === 'Search'} onPress={mode === 'Search' ? handleOpenModal : () => navigation?.navigate('Searched_Bills')} />
      </View>
    </View>
  );
}

export default BillTopNav;


const createStyles = (theme : any) =>
  StyleSheet.create({
    pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.titleText,
  },
  activePageTitle: {
    color: theme.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftSpacer: {
    flex: 1,
  },
  centerGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navItem: {
    marginHorizontal: 10,
  },
  });
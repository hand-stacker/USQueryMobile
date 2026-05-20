import SearchButton from "@/app/components/SearchButton";
import { UnscalableText } from "@/app/components/UnscalableText";
import { ThemeContext } from "@/app/theme/themeContext";
import { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  navigation: any;
  mode: 'Starred' | 'Search';
  handleOpenModal?: () => void;
}

const MemTopNav = ({ navigation, mode, handleOpenModal }: Props) => {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.leftSpacer} />
      <View style={styles.centerGroup}>
        <Pressable onPress={() => navigation?.navigate('Starred_Members') } style={styles.navItem}>
          <UnscalableText style={[styles.pageTitle, mode === 'Starred' && styles.activePageTitle]}>Starred</UnscalableText>
        </Pressable>
        <Pressable onPress={mode === 'Search' ? handleOpenModal : () => navigation?.navigate('Searched_Members')} style={styles.navItem}>
          <UnscalableText style={[styles.pageTitle, mode === 'Search' && styles.activePageTitle]}>Search</UnscalableText>
        </Pressable>
      </View>
      <View style={styles.rightGroup}>
        <SearchButton highlighted={mode === 'Search'} onPress={mode === 'Search' ? handleOpenModal : () => navigation?.navigate('Searched_Members')} />
      </View>
    </View>
  );
}

export default MemTopNav;

const createStyles = (theme: any) => StyleSheet.create({
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
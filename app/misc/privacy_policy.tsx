import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/themeContext';

export default function PrivacyPolicy() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.header}>Independent App Disclaimer</Text>

      <Text style={styles.text}>
        My Congress is an independent, third-party app and is not affiliated with, endorsed by, or authorized by the U.S. government or any government entity. Congressional data is sourced from official government sources, including congress.gov (Library of Congress), senate.gov, and house.gov.
      </Text>

      <Text style={styles.text}>
        This privacy policy applies to the My Congress app (hereby referred to as "Application") for mobile devices that was created by USQuery (hereby referred to as "Service Provider") as a Freemium service. This service is intended for use "AS IS".
      </Text>

      <Text style={styles.header}>Information Collection and Use</Text>

      <Text style={styles.text}>
        The Application collects information when you download and use it. This information may include information such as
      </Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• Your device's Internet Protocol address (e.g. IP address)</Text>
        <Text style={styles.listItem}>• The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</Text>
        <Text style={styles.listItem}>• The time spent on the Application</Text>
        <Text style={styles.listItem}>• The operating system you use on your mobile device</Text>
      </View>

      <Text style={styles.text}>
        The Application does not gather precise information about the location of your mobile device.
      </Text>

      <Text style={styles.text}>
        The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.
      </Text>

      <Text style={styles.text}>
        For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information, including but not limited to Email, UserId, Device Identifiers. The information that the Service Provider request will be retained by them and used as described in this privacy policy.
      </Text>

      <Text style={styles.header}>Third Party Access</Text>

      <Text style={styles.text}>
        Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.
      </Text>

      <Text style={styles.text}>
        Please note that the Application utilizes third-party services that have their own Privacy Policy about handling data. Below are the links to the Privacy Policy of the third-party service providers used by the Application:
      </Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• Expo</Text>
      </View>

      <Text style={styles.text}>
        The Service Provider may disclose User Provided and Automatically Collected Information:
      </Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• as required by law, such as to comply with a subpoena, or similar legal process;</Text>
        <Text style={styles.listItem}>• when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</Text>
        <Text style={styles.listItem}>• with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.</Text>
      </View>

      <Text style={styles.header}>Opt-Out Rights</Text>

      <Text style={styles.text}>
        You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.
      </Text>

      <Text style={styles.header}>Data Retention Policy</Text>

      <Text style={styles.text}>
        The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at usquery.help@gmail.com and they will respond in a reasonable time.
      </Text>

      <Text style={styles.header}>Children</Text>

      <Text style={styles.text}>
        The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.
      </Text>

      <Text style={styles.text}>
        The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age. In the case the Service Provider discover that a child under 13 has provided personal information, the Service Provider will immediately delete this from their servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact the Service Provider (usquery.help@gmail.com) so that they will be able to take the necessary actions.
      </Text>

      <Text style={styles.header}>Security</Text>

      <Text style={styles.text}>
        The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.
      </Text>

      <Text style={styles.header}>Changes</Text>

      <Text style={styles.text}>
        This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
      </Text>

      <Text style={styles.text}>
        This privacy policy is effective as of 2026-02-12
      </Text>

      <Text style={styles.header}>Your Consent</Text>

      <Text style={styles.text}>
        By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
      </Text>

      <Text style={styles.header}>Contact Us</Text>

      <Text style={styles.text}>
        If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email at usquery.help@gmail.com.
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: '24%',
    backgroundColor: theme.background,
  },
  title: {
    color: theme.text,
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 20,
  },
  text: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
    lineHeight: 24,
  },
  listContainer: {
    marginBottom: 10,
  },
  listItem: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 20,
    marginBottom: 5,
    lineHeight: 24,
  },
  button: {
    width: "100%",
    minHeight: 50,
    marginBottom: 12,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
      textAlign: "center",
      fontSize: 16,
      color: theme.innerText,
      fontWeight: "600",
  },
});
import React, { useContext } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TERMS_OF_USE_URL } from '../../constants/iap';
import { ThemeContext } from '../theme/themeContext';

/**
 * In-app copy of the EULA, so the terms are readable offline and from Settings.
 * The hosted version at TERMS_OF_USE_URL stays canonical — it is what App Store
 * Connect files as the custom License Agreement, and what the Plans screen
 * links to. Keep the two in sync; the source of truth for both is
 * docs/legal/terms-of-use.txt.
 */
export default function TermsOfUse() {
  const { theme } = useContext(ThemeContext);
  const { width, height } = useWindowDimensions();
  const styles = createStyles(theme, width > height);
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView>
      <Text style={styles.title}>Terms of Use</Text>

      <Text style={styles.text}>
        End User License Agreement · Effective August 17, 2026
      </Text>

      <Pressable onPress={() => Linking.openURL(TERMS_OF_USE_URL).catch(() => {})}>
        <Text style={styles.link}>View the current version online</Text>
      </Pressable>

      <Text style={styles.header}>1. Agreement to These Terms</Text>

      <Text style={styles.text}>
        These Terms of Use ("Terms") are a binding agreement between you and USQuery LLC ("USQuery", "we", "us", or "our") governing your use of the My Congress mobile application, the USQuery web application, and any related services, data, and content we provide (together, the "Service").
      </Text>

      <Text style={styles.text}>
        By downloading, installing, accessing, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
      </Text>

      <Text style={styles.text}>
        These Terms are also referred to as an End User License Agreement, or EULA. If you obtained the app through the Apple App Store or Google Play, additional terms from those stores apply to you, and Section 14 sets out terms required by Apple.
      </Text>

      <Text style={styles.text}>
        You must be at least 13 years old to use the Service. If you are under the age of majority where you live, you may use the Service only with the involvement of a parent or guardian who agrees to these Terms.
      </Text>

      <Text style={styles.header}>2. Independence and Data Accuracy</Text>

      <Text style={styles.text}>
        My Congress is an independent, third-party app and is not affiliated with, endorsed by, or authorized by the U.S. government or any government entity. Congressional data is sourced from official government sources, including congress.gov (Library of Congress), senate.gov, and house.gov.
      </Text>

      <Text style={styles.text}>
        We do not control those sources. Legislative information may be delayed, incomplete, superseded, or corrected after we display it. Vote records, bill text, sponsorship, member information, and status indicators are provided for general information only. You should not rely on the Service as the authoritative record of any legislative action. For an official record, consult the primary government source.
      </Text>

      <Text style={styles.text}>
        The Service is not affiliated with, and does not represent the views of, any member of Congress, political party, campaign, or advocacy organization.
      </Text>

      <Text style={styles.header}>3. License Grant and Restrictions</Text>

      <Text style={styles.text}>
        Subject to your compliance with these Terms, USQuery LLC grants you a limited, personal, non-exclusive, non-transferable, non-sublicensable, revocable license to install and use the Service for your own non-commercial, informational use.
      </Text>

      <Text style={styles.text}>You may not:</Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• copy, modify, translate, or create derivative works of the Service;</Text>
        <Text style={styles.listItem}>• reverse engineer, decompile, or disassemble the app, or attempt to derive its source code, models, or model weights, except to the extent this restriction is prohibited by applicable law;</Text>
        <Text style={styles.listItem}>• rent, lease, lend, sell, sublicense, or otherwise transfer the Service or your account;</Text>
        <Text style={styles.listItem}>• access the Service or our APIs by automated means, including scraping, crawling, or bulk downloading, other than through the app or web interface as intended;</Text>
        <Text style={styles.listItem}>• circumvent, disable, or interfere with any rate limit, access control, authentication, security feature, or usage limit tied to your subscription tier;</Text>
        <Text style={styles.listItem}>• redistribute, resell, or publish our compiled datasets, AI outputs, or original content as a standalone product or dataset, or use them to build, train, or improve a competing product or model;</Text>
        <Text style={styles.listItem}>• remove or obscure any copyright, trademark, or other proprietary notice.</Text>
      </View>

      <Text style={styles.text}>We reserve all rights not expressly granted to you.</Text>

      <Text style={styles.header}>4. Accounts</Text>

      <Text style={styles.text}>
        Some features require an account. You may register directly or sign in with Apple or Google. You agree to provide accurate information, to keep your credentials secure, and to be responsible for all activity under your account.
      </Text>

      <Text style={styles.text}>
        Accounts are for a single person. Do not share your account or your subscription entitlements with others.
      </Text>

      <Text style={styles.text}>
        We may suspend or terminate your account if you violate these Terms, if we are required to by law, or if your use poses a risk to the Service or other users. Where practical, we will tell you why.
      </Text>

      <Text style={styles.text}>
        You may delete your account at any time from within the app. Deleting your account cancels access to paid features; it does not by itself cancel a subscription billed by Apple or Google, which you must cancel through that store.
      </Text>

      <Text style={styles.header}>5. Subscriptions, Billing, and Cancellation</Text>

      <Text style={styles.text}>
        The Service is offered on a freemium basis. A free tier is available, and paid auto-renewing subscription tiers — currently Plus, Plus Pro, and Premium — unlock higher usage limits and additional features. The features and limits of each tier are described on the Plans screen, and may change as described in Section 12.
      </Text>

      <Text style={styles.text}>
        Prices are shown in the app before you purchase, in your local currency where supported. The price displayed at the point of purchase is the price that applies to you.
      </Text>

      <Text style={styles.text}>
        Purchases made on iOS. Subscriptions purchased in the iOS app are sold and billed by Apple through your Apple ID, in accordance with Apple's terms.
      </Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• Payment is charged to your Apple ID account at confirmation of purchase.</Text>
        <Text style={styles.listItem}>• The subscription renews automatically for the same period unless auto-renew is turned off at least 24 hours before the end of the current period.</Text>
        <Text style={styles.listItem}>• Your account is charged for renewal within 24 hours prior to the end of the current period.</Text>
        <Text style={styles.listItem}>• You can manage your subscription and turn off auto-renew in your Apple ID account settings. Deleting the app does not cancel your subscription.</Text>
        <Text style={styles.listItem}>• Refunds are handled by Apple under Apple's policies. We cannot issue refunds for App Store purchases.</Text>
        <Text style={styles.listItem}>• Any unused portion of a free trial, if offered, is forfeited when you purchase a subscription.</Text>
      </View>

      <Text style={styles.text}>
        Purchases made on Android or the web. Subscriptions purchased outside the iOS app are billed through our payment processor, Stripe. Those subscriptions renew automatically at the interval shown at checkout until cancelled. You can cancel or change your plan at any time through the billing portal linked in the app or on the website. Cancellation takes effect at the end of the current billing period, and you keep access until then.
      </Text>

      <Text style={styles.text}>
        Changes, upgrades, and downgrades. Upgrading or downgrading between tiers takes effect according to the rules of the store or processor that bills you. Downgrades scheduled through the app take effect at the end of your current period; you keep your current tier until then.
      </Text>

      <Text style={styles.text}>
        Price changes. We may change subscription prices. We will give you advance notice, and where required we will ask for your consent before the new price takes effect. Price changes never apply retroactively to a period you have already paid for. If you do not accept a price change, you may cancel before it takes effect.
      </Text>

      <Text style={styles.text}>
        Taxes. Prices may exclude applicable taxes, which will be added where required.
      </Text>

      <Text style={styles.header}>6. AI-Generated Content</Text>

      <Text style={styles.text}>
        The Service includes features that generate content automatically, including Vote Predictions (simulated votes produced by a neural network trained on historical congressional voting data) and the AI chat feature that answers questions about bills.
      </Text>

      <Text style={styles.text}>You acknowledge and agree that:</Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• These outputs are machine-generated estimates, not statements of fact and not reports of anything that has actually happened.</Text>
        <Text style={styles.listItem}>• A vote prediction is not a forecast of how any member of Congress will actually vote, and must not be presented or relied upon as one. Real votes depend on factors the model does not observe.</Text>
        <Text style={styles.listItem}>• AI output may be inaccurate, incomplete, outdated, internally inconsistent, or simply wrong, including where it appears confident and specific.</Text>
        <Text style={styles.listItem}>• AI output is provided for general informational and educational purposes only, and is not legal, financial, investment, electoral, lobbying, or other professional advice.</Text>
        <Text style={styles.listItem}>• You are responsible for independently verifying anything you rely on, against the primary government sources described in Section 2.</Text>
        <Text style={styles.listItem}>• You must not present AI output as the official position, statement, or record of any member of Congress, government body, or other person.</Text>
      </View>

      <Text style={styles.text}>
        We make no warranty as to the accuracy of any AI output. Section 10 applies in full to these features.
      </Text>

      <Text style={styles.header}>7. Acceptable Use</Text>

      <Text style={styles.text}>You agree not to use the Service to:</Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• break any applicable law or regulation, or infringe anyone's rights;</Text>
        <Text style={styles.listItem}>• harass, threaten, defame, or impersonate any person, including any elected official;</Text>
        <Text style={styles.listItem}>• misrepresent AI output or Service data as official, verified, or endorsed by any government body;</Text>
        <Text style={styles.listItem}>• upload or transmit malicious code, or attempt to gain unauthorized access to the Service, other accounts, or our infrastructure;</Text>
        <Text style={styles.listItem}>• probe, scan, or test the vulnerability of the Service, or disrupt or overload it;</Text>
        <Text style={styles.listItem}>• collect personal information about other users.</Text>
      </View>

      <Text style={styles.header}>8. Intellectual Property</Text>

      <Text style={styles.text}>
        The Service — including the app, website, design, branding, text we write, compilations, models, and software — is owned by USQuery LLC and protected by intellectual property laws. "My Congress" and "USQuery" and our logos are our trademarks.
      </Text>

      <Text style={styles.text}>
        Underlying U.S. government legislative data is generally in the public domain and is not claimed by us. Our selection, arrangement, enrichment, and presentation of that data is ours.
      </Text>

      <Text style={styles.text}>
        Feedback you send us is voluntary, and we may use it without obligation or compensation to you.
      </Text>

      <Text style={styles.header}>9. Third-Party Services</Text>

      <Text style={styles.text}>
        The Service relies on third parties, including Apple, Google, Stripe, and Expo, and may link to third-party sites. Their terms and privacy policies govern your use of their services, and we are not responsible for them. Your use of the Service is also subject to any applicable third-party terms.
      </Text>

      <Text style={styles.text}>
        Our handling of your information is described in our Privacy Policy, available from Settings and at usquery.com.
      </Text>

      <Text style={styles.header}>10. Disclaimer of Warranties</Text>

      <Text style={styles.text}>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, USQUERY LLC DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
      </Text>

      <Text style={styles.text}>
        We do not warrant that the Service will be uninterrupted, secure, or error-free, that data or AI output will be accurate or complete, or that defects will be corrected.
      </Text>

      <Text style={styles.text}>
        Some jurisdictions do not allow the exclusion of certain warranties, so some of the above may not apply to you.
      </Text>

      <Text style={styles.header}>11. Limitation of Liability and Indemnity</Text>

      <Text style={styles.text}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, USQUERY LLC WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATING TO THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY.
      </Text>

      <Text style={styles.text}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) TWENTY U.S. DOLLARS (US$20).
      </Text>

      <Text style={styles.text}>
        You agree to indemnify and hold harmless USQuery LLC from any claim, loss, or expense (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any law or third-party right.
      </Text>

      <Text style={styles.text}>
        Some jurisdictions do not allow certain limitations of liability, so some of the above may not apply to you. Nothing in these Terms limits liability that cannot be limited by law.
      </Text>

      <Text style={styles.header}>12. Changes to the Service and to These Terms</Text>

      <Text style={styles.text}>
        We may add, change, or discontinue features, tiers, and usage limits. If a change materially reduces a paid feature you are currently paying for, you may cancel your subscription as described in Section 5.
      </Text>

      <Text style={styles.text}>
        We may update these Terms. We will post the updated Terms with a new effective date, and where the change is material we will give reasonable notice in the app or by email. Continued use of the Service after the change takes effect means you accept the updated Terms.
      </Text>

      <Text style={styles.header}>13. Governing Law and General Terms</Text>

      <Text style={styles.text}>
        These Terms apply for as long as you use the Service. Sections 8, 10, 11, and 13 survive termination.
      </Text>

      <Text style={styles.text}>
        Governing law. These Terms are governed by the laws of the State of California, without regard to its conflict-of-laws rules.
      </Text>

      <Text style={styles.text}>
        Venue. You and USQuery LLC agree to the exclusive jurisdiction of the state and federal courts located in California for any dispute arising out of or relating to these Terms or the Service, except that either party may seek injunctive relief in any court of competent jurisdiction. If you are a consumer, this does not deprive you of the protection of mandatory consumer-protection provisions of the law of your country of residence.
      </Text>

      <Text style={styles.text}>
        Severability. If any provision is found unenforceable, the rest remains in effect. No waiver. Our failure to enforce a provision is not a waiver of it. Entire agreement. These Terms and the Privacy Policy are the entire agreement between you and USQuery LLC regarding the Service. Assignment. You may not assign these Terms. We may assign them in connection with a merger, acquisition, or sale of assets.
      </Text>

      <Text style={styles.header}>14. Terms Required by Apple</Text>

      <Text style={styles.text}>
        This section applies to the My Congress app obtained through the Apple App Store, and applies in addition to the rest of these Terms. In the event of a conflict, this section controls with respect to your use of the app on Apple devices.
      </Text>

      <View style={styles.listContainer}>
        <Text style={styles.listItem}>• Acknowledgement. These Terms are concluded between you and USQuery LLC only, and not with Apple Inc. ("Apple"). USQuery LLC, not Apple, is solely responsible for the app and its content. These Terms do not provide for usage rules for the app that conflict with the Apple Media Services Terms and Conditions as of the effective date of these Terms.</Text>
        <Text style={styles.listItem}>• Scope of licence. The licence granted to you in Section 3 is a non-transferable licence to use the app on any Apple-branded products that you own or control, and as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions, except that the app may be accessed and used by other accounts associated with you via Family Sharing or volume purchasing.</Text>
        <Text style={styles.listItem}>• Maintenance and support. USQuery LLC is solely responsible for providing any maintenance and support services for the app, as specified in these Terms or as required under applicable law. Apple has no obligation whatsoever to furnish any maintenance and support services for the app.</Text>
        <Text style={styles.listItem}>• Warranty. USQuery LLC is solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. In the event of any failure of the app to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price (if any) for the app to you. To the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the app, and any other claims, losses, liabilities, damages, costs, or expenses attributable to any failure to conform to any warranty will be the sole responsibility of USQuery LLC.</Text>
        <Text style={styles.listItem}>• Product claims. USQuery LLC, not Apple, is responsible for addressing any claims by you or any third party relating to the app or your possession and use of the app, including: (i) product liability claims; (ii) any claim that the app fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation, including in connection with the app's use of frameworks that handle health or fitness data, where applicable.</Text>
        <Text style={styles.listItem}>• Intellectual property rights. In the event of any third-party claim that the app or your possession and use of the app infringes that third party's intellectual property rights, USQuery LLC, not Apple, will be solely responsible for the investigation, defence, settlement, and discharge of any such intellectual property infringement claim.</Text>
        <Text style={styles.listItem}>• Legal compliance. You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a "terrorist supporting" country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.</Text>
        <Text style={styles.listItem}>• Developer contact. Any questions, complaints, or claims with respect to the app should be directed to USQuery LLC at usquery.help@gmail.com.</Text>
        <Text style={styles.listItem}>• Third-party terms. You must comply with applicable third-party terms of agreement when using the app.</Text>
        <Text style={styles.listItem}>• Third-party beneficiary. You acknowledge and agree that Apple, and Apple's subsidiaries, are third-party beneficiaries of these Terms, and that upon your acceptance of these Terms, Apple will have the right (and will be deemed to have accepted the right) to enforce these Terms against you as a third-party beneficiary of these Terms.</Text>
      </View>

      <Text style={styles.header}>15. Contact</Text>

      <Text style={styles.text}>
        USQuery LLC — usquery.help@gmail.com
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isLandscape = false) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: '18%',
    paddingTop: isLandscape ? '6%' : '24%',
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
  link: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
});

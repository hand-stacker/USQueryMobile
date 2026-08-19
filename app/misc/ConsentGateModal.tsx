import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { DisclaimerContent } from './DisclaimerContent';
import { MODAL_PRIORITY, useModalSlot } from './modalQueue';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsOfUseContent } from './TermsOfUseContent';

type Step = 'disclaimer' | 'privacy' | 'terms' | null;

/**
 * The first-run consent gate: Disclaimer -> Privacy Policy -> Terms of Use.
 *
 * All three steps share this one <Modal>. Each step used to own its own, which
 * meant every step change dismissed one native modal and presented another in
 * the same commit — iOS drops the second present and the app ends up with an
 * invisible full-screen view eating all touches. Swapping children inside a
 * modal that stays presented has no such race.
 */
export default function ConsentGateModal() {
  const hydrated = useAppSettingsStore((s) => s._hasHydrated);
  const disclaimerAccepted = useAppSettingsStore((s) => s.disclaimerAccepted);
  const privacyAccepted = useAppSettingsStore((s) => s.privacyAccepted);
  const termsAccepted = useAppSettingsStore((s) => s.termsAccepted);
  const setDisclaimerAccepted = useAppSettingsStore((s) => s.setDisclaimerAccepted);
  const setPrivacyAccepted = useAppSettingsStore((s) => s.setPrivacyAccepted);
  const setTermsAccepted = useAppSettingsStore((s) => s.setTermsAccepted);

  const step: Step = !hydrated
    ? null
    : !disclaimerAccepted
      ? 'disclaimer'
      : !privacyAccepted
        ? 'privacy'
        : !termsAccepted
          ? 'terms'
          : null;

  const visible = useModalSlot('consent', MODAL_PRIORITY.consent, step !== null);

  // On iOS the modal stays mounted while it fades out, so hold on to the last
  // step until the dismiss completes — otherwise accepting the final step
  // blanks the dialog a frame before it disappears.
  const [shown, setShown] = useState<Step>(null);
  useEffect(() => {
    if (step) setShown(step);
  }, [step]);

  return (
    // onRequestClose is required on Android; kept inert on purpose so the
    // hardware back button cannot dismiss a consent gate without a choice.
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {}}
      onDismiss={() => setShown(null)}
    >
      {shown === 'disclaimer' && (
        <DisclaimerContent onAccept={() => setDisclaimerAccepted(true)} />
      )}
      {shown === 'privacy' && (
        <PrivacyPolicyContent onAccept={() => setPrivacyAccepted(true)} />
      )}
      {shown === 'terms' && (
        <TermsOfUseContent onAccept={() => setTermsAccepted(true)} />
      )}
    </Modal>
  );
}

/** True once the user has cleared every consent step. */
export function useConsentComplete() {
  const hydrated = useAppSettingsStore((s) => s._hasHydrated);
  const disclaimerAccepted = useAppSettingsStore((s) => s.disclaimerAccepted);
  const privacyAccepted = useAppSettingsStore((s) => s.privacyAccepted);
  const termsAccepted = useAppSettingsStore((s) => s.termsAccepted);
  return hydrated && disclaimerAccepted && privacyAccepted && termsAccepted;
}

import { useStarredMembersStore } from '@/app/store/starredMembersStore';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
	membershipId: string | number;
	size?: number;
	style?: ViewStyle | any;
	onChange?: (isStarred: boolean) => void;
};

export default function MemStarButton({ membershipId, size = 20, style, onChange }: Props) {
	const id = String(membershipId);
	const stars = useStarredMembersStore((s) => s.stars);
	const addStar = useStarredMembersStore((s) => s.addStar);
	const removeStar = useStarredMembersStore((s) => s.removeStar);
	const isStarred = stars.includes(id);

	const handlePress = async () => {
		try {
			if (isStarred) {
				removeStar(id);
				onChange?.(false);
			} else {
				addStar(id);
				onChange?.(true);
			}
		} catch (e) {
			// ignore
		}
	};

	return (
		<TouchableOpacity onPress={handlePress} style={[styles.btn, style]} accessibilityLabel={isStarred ? 'Unstar' : 'Star'}>
			<Text style={[styles.star, { fontSize: size, color: isStarred ? '#f59e0b' : '#9CA3AF' }]}>
				{isStarred ? '★' : '☆'}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	btn: {
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
    backgroundColor: 'transparent',
	},
	star: {
		lineHeight: 20,
	},
});

import { memo, useCallback, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    node: any;
    handlePress: () => void;
}

function computeInitials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MemberInfographic = ({ node, handlePress }: Props) => {
    const fullName = useMemo(() => node?.member?.fullName ?? node?.member__full_name ?? 'Unknown', [node?.member?.fullName, node?.member__full_name]);
    const imageUrl = useMemo(() => node?.member?.imageLink ?? node?.member__image_link ?? null, [node?.member?.imageLink, node?.member__image_link]);

    const initials = useMemo(() => computeInitials(fullName), [fullName]);

    const imageSource = useMemo(() => (imageUrl ? { uri: imageUrl } : undefined), [imageUrl]);

    const districtNum = node?.district_num ?? node?.districtNum ?? null;

    const onPress = useCallback(() => {
        handlePress?.();
    }, [handlePress]);

    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={styles.avatarWrap}>
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}
            </View>
            <View style={styles.textWrap}>
                <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
                <Text style={styles.subText} numberOfLines={1} ellipsizeMode="tail">
                    {node?.state ?? ''}{districtNum === null ? '' : `-${districtNum}`} [{node?.party?.[0] ?? ''}]
                    </Text>
            </View>
        </Pressable>
    );
}

export default memo(MemberInfographic);

const styles = StyleSheet.create({
    card: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        // subtle shadow / elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        marginVertical: 4,
    },
    avatarWrap: {
        width: 56,
        height: 56,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        flexShrink: 0,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16,
    },
    textWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    text: { fontSize: 16, color: '#0f172a', fontWeight: '600' },
    subText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
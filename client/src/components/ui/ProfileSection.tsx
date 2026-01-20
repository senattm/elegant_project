import { Paper, Text, Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface ProfileSectionProps {
    title: string;
    children: ReactNode;
}

const ProfileSection = ({ title, children }: ProfileSectionProps) => {
    return (
        <Paper shadow="none" p="xl" withBorder>
            <Text fz={20} fw={500} mb="md">
                {title}
            </Text>
            <Stack gap="md">{children}</Stack>
        </Paper>
    );
};

export default ProfileSection;

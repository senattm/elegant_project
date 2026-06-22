import { TextInput } from "@mantine/core";
import type { TextInputProps } from "@mantine/core";
import type { ReactNode } from "react";

interface FormInputProps extends Omit<TextInputProps, "onChange"> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon?: ReactNode;
    error?: string;
    formatter?: (value: string) => string;
}

const FormInput = ({
    label,
    value,
    onChange,
    icon,
    error,
    formatter,
    ...props
}: FormInputProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = formatter ? formatter(e.target.value) : e.target.value;
        onChange(newValue);
    };

    return (
        <TextInput
            label={label}
            value={value}
            onChange={handleChange}
            leftSection={icon}
            error={error}
            {...props}
        />
    );
};

export default FormInput;

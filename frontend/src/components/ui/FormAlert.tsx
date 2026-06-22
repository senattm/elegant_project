import { Alert } from "@mantine/core";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";

interface FormAlertProps {
    type: "success" | "error";
    message: string;
}

const FormAlert = ({ type, message }: FormAlertProps) => {
    if (!message) return null;

    return (
        <Alert
            icon={type === "success" ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={type === "success" ? "green" : "red"}
            title={type === "success" ? "Başarılı" : "Hata"}
        >
            {message}
        </Alert>
    );
};

export default FormAlert;

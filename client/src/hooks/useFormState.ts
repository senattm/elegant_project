import { useState } from "react";

interface FormState {
    loading: boolean;
    success: string;
    error: string;
}

export const useFormState = () => {
    const [state, setState] = useState<FormState>({
        loading: false,
        success: "",
        error: "",
    });

    const setLoading = (loading: boolean) => {
        setState((prev) => ({ ...prev, loading }));
    };

    const setSuccess = (message: string) => {
        setState({ loading: false, success: message, error: "" });
    };

    const setError = (message: string) => {
        setState({ loading: false, success: "", error: message });
    };

    const reset = () => {
        setState({ loading: false, success: "", error: "" });
    };

    return {
        ...state,
        setLoading,
        setSuccess,
        setError,
        reset,
    };
};

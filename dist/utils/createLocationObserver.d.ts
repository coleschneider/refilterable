export default function createLocationObserver(initialQueryString?: string): {
    watch: (param: string, callback: Function) => Function;
    notify: (queryString: string) => void;
    getParamInfo: (paramName: string) => {
        hasParam: boolean;
        paramValue: string | null;
    };
    getCurrentParams: () => URLSearchParams;
};

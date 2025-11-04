import app from "../../src/index";

export const requestFromDevApp = (path: string, init?: RequestInit) => {
	return app.request(path, init);
};

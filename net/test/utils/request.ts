import app from "../../src/index";

export const requestFromNetApp = (path: string, init?: RequestInit) => {
	return app.request(path, init);
};

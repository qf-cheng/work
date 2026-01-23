const demo = require("./local/demo");
const page = require("./local/page");
export function localPage(id = "user_list") {
	switch (id) {
		case "user_list":
			return demo;
		case "admin_list":
			return page;
		default:
			return demo;
	}
}

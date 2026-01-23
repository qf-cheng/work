import LCLayout from "./nodes/layout";
import LCButton from "./nodes/LCButton.vue";
import LCDialog from "./nodes/LCDialog.vue";
import LCForm from "./nodes/LCForm.vue";
import LCFormItem from "./nodes/LCFormItem.vue";
import LCInput from "./nodes/LCInput.vue";
import LCPagination from "./nodes/LCPagination.vue";
import LCSelect from "./nodes/LCSelect.vue";
import LCTable from "./nodes/LCTable.vue";
import LCText from "./nodes/LCText.vue";

export const componentRegistry = {
  Button: LCButton,
  Table: LCTable,
  Text: LCText,
  Dialog: LCDialog,
  Form: LCForm,
	FormItem: LCFormItem,
  Input: LCInput,
	Select: LCSelect,
	Pagination: LCPagination,
	...LCLayout
};

export function resolveComponent(type) {
  return componentRegistry[type] || LCText;
}

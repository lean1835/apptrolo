/**
 * Cắt tỉa khoảng trắng thừa ở tất cả các chuỗi trong biểu mẫu một cách đệ quy.
 * Tương tự hàm trimValues từ formUtils.ts tại tiêu chuẩn SkillFE.md.
 */
export const trimValues = (values: any): any => {
  if (!values) return values;
  
  if (Array.isArray(values)) {
    return values.map((val) => trimValues(val));
  }
  
  if (typeof values === "object" && values !== null) {
    const result: any = { ...values };
    Object.keys(result).forEach((key) => {
      if (typeof result[key] === "string") {
        result[key] = result[key].trim();
      } else if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = trimValues(result[key]);
      }
    });
    return result;
  }
  
  return values;
};

/**
 * Kiểm tra xem một chuỗi có chỉ toàn khoảng trắng hoặc trống hay không.
 * Ngăn chặn người dùng nhập nguyên khoảng trắng (Mục 9.3 SkillFE.md).
 * Trả về thông báo lỗi nếu không hợp lệ, hoặc null nếu hợp lệ.
 */
export const validateWhitespace = (value: string | undefined | null): string | null => {
  if (!value) {
    return "Vui lòng không để trống trường này!";
  }
  
  if (typeof value === "string" && value.trim() === "" && value.length > 0) {
    return "Không được chỉ nhập khoảng trắng!";
  }
  
  return null;
};

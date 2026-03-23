import React from 'react';
import { View } from 'react-native';

export const captureRef = async () => {
    throw new Error("Lưu ảnh không được hỗ trợ trên Web, vui lòng sử dụng điện thoại.");
};

export const CaptureView = React.forwardRef((props, ref) => (
    <View ref={ref} {...props}>{props.children}</View>
));

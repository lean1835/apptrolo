import React from 'react';
import Svg, { Path, Polyline, Circle, Rect, Line, Polygon } from 'react-native-svg';

export const HomeIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={color} fillOpacity={0.12} />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

export const DoorIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="3" width="18" height="18" rx="2" fill={color} fillOpacity={0.12} />
    <Path d="M3 3h18v18H3zM16 3v18" />
    <Circle cx="12" cy="12" r="1.2" fill={color} />
  </Svg>
);

export const MoneyIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="5" width="18" height="14" rx="2" fill={color} fillOpacity={0.12} />
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

export const SettingsIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill={color} fillOpacity={0.12} />
    <Circle cx="12" cy="12" r="3" fill="#fff" />
  </Svg>
);

export const BoltIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity={0.12} />
  </Svg>
);

export const DropletIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill={color} fillOpacity={0.12} />
  </Svg>
);

export const ReceiptIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" fill={color} fillOpacity={0.12} />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="8" y1="13" x2="16" y2="13" />
    <Line x1="8" y1="17" x2="16" y2="17" />
  </Svg>
);

export const BellIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={color} fillOpacity={0.12} />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" fill={color} />
  </Svg>
);

export const UserIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={color} fillOpacity={0.12} />
    <Circle cx="12" cy="7" r="4" fill={color} fillOpacity={0.12} />
  </Svg>
);

export const PlusIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="12" cy="12" r="10" fill={color} fillOpacity={0.12} />
    <Line x1="12" y1="8" x2="12" y2="16" />
    <Line x1="8" y1="12" x2="16" y2="12" />
  </Svg>
);

export const EditIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill={color} fillOpacity={0.12} />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const LogoutIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill={color} fillOpacity={0.12} />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </Svg>
);

export const LockIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill={color} fillOpacity={0.12} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const CloudIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" fill={color} fillOpacity={0.12} />
    <Polyline points="16 16 12 12 8 16" />
    <Line x1="12" y1="12" x2="12" y2="21" />
  </Svg>
);

export const RestoreIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M3.51 15a9 9 0 1 0 .49-3.29" fill={color} fillOpacity={0.12} />
    <Polyline points="1 4 1 10 7 10" />
    <Path d="M3.51 15a9 9 0 1 0 .49-3.29" />
  </Svg>
);

export const BuildingIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Rect x="1" y="3" width="15" height="18" fill={color} fillOpacity={0.12} />
    <Path d="M16 8h4l3 3v10h-7V8z" fill={color} fillOpacity={0.06} />
    <Rect x="1" y="3" width="15" height="18" />
    <Path d="M16 8h4l3 3v10h-7V8z" />
    <Line x1="5" y1="8" x2="5.01" y2="8" strokeWidth={strokeWidth * 1.5} />
    <Line x1="5" y1="12" x2="5.01" y2="12" strokeWidth={strokeWidth * 1.5} />
    <Line x1="5" y1="16" x2="5.01" y2="16" strokeWidth={strokeWidth * 1.5} />
    <Line x1="11" y1="8" x2="11.01" y2="8" strokeWidth={strokeWidth * 1.5} />
    <Line x1="11" y1="12" x2="11.01" y2="12" strokeWidth={strokeWidth * 1.5} />
    <Line x1="11" y1="16" x2="11.01" y2="16" strokeWidth={strokeWidth * 1.5} />
  </Svg>
);

export const CheckIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="12" cy="12" r="10" fill={color} fillOpacity={0.12} />
    <Polyline points="16 9 11 14 8 11" />
  </Svg>
);

export const SendIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Polygon points="22 2 15 22 11 13 2 9 22 2" fill={color} fillOpacity={0.12} />
    <Line x1="22" y1="2" x2="11" y2="13" />
  </Svg>
);

export const ChevronIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export const BackIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

export const DownloadIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill={color} fillOpacity={0.12} />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

export const ShareIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="18" cy="5" r="3" fill={color} fillOpacity={0.12} />
    <Circle cx="6" cy="12" r="3" fill={color} fillOpacity={0.12} />
    <Circle cx="18" cy="19" r="3" fill={color} fillOpacity={0.12} />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);

export const AlertIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Circle cx="12" cy="12" r="10" fill={color} fillOpacity={0.12} />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Circle cx="12" cy="16" r="1" fill={color} />
  </Svg>
);

export const ActivityIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Svg>
);

export const PlusUserIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill={color} fillOpacity={0.12} />
    <Circle cx="9" cy="7" r="4" fill={color} fillOpacity={0.12} />
    <Line x1="19" y1="8" x2="19" y2="14" />
    <Line x1="16" y1="11" x2="22" y2="11" />
  </Svg>
);

export const AlertTriangleIcon = ({ size = 24, color = "currentColor", strokeWidth = 1.8, ...props }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill={color} fillOpacity={0.12} />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

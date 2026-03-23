import React from 'react';
import Svg, { Path, Polyline, Circle, Rect, Line, Polygon } from 'react-native-svg';

const withIcon = (children, viewBox = "0 0 24 24") => ({ size = 24, color = "currentColor", ...props }) => (
  <Svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </Svg>
);

export const HomeIcon = withIcon(<>
  <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <Polyline points="9 22 9 12 15 12 15 22" />
</>);

export const DoorIcon = withIcon(<>
  <Path d="M3 3h18v18H3zM16 3v18" />
  <Circle cx="14" cy="12" r="1" fill="currentColor" />
</>);

export const MoneyIcon = withIcon(<>
  <Line x1="12" y1="1" x2="12" y2="23" />
  <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
</>);

export const SettingsIcon = withIcon(<>
  <Circle cx="12" cy="12" r="3" />
  <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>);

export const BoltIcon = withIcon(<>
  <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
</>);

export const DropletIcon = withIcon(<>
  <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
</>);

export const ReceiptIcon = withIcon(<>
  <Path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
  <Polyline points="14 2 14 8 20 8" />
  <Line x1="8" y1="13" x2="16" y2="13" />
  <Line x1="8" y1="17" x2="16" y2="17" />
</>);

export const BellIcon = withIcon(<>
  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
  <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
</>);

export const UserIcon = withIcon(<>
  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  <Circle cx="12" cy="7" r="4" />
</>);

export const PlusIcon = withIcon(<>
  <Line x1="12" y1="5" x2="12" y2="19" />
  <Line x1="5" y1="12" x2="19" y2="12" />
</>, "0 0 24 24"); // some had different stroke widths in CSS but the paths are the same

export const EditIcon = withIcon(<>
  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
</>);

export const LogoutIcon = withIcon(<>
  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <Polyline points="16 17 21 12 16 7" />
  <Line x1="21" y1="12" x2="9" y2="12" />
</>);

export const LockIcon = withIcon(<>
  <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
</>);

export const CloudIcon = withIcon(<>
  <Polyline points="16 16 12 12 8 16" />
  <Line x1="12" y1="12" x2="12" y2="21" />
  <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
</>);

export const RestoreIcon = withIcon(<>
  <Polyline points="1 4 1 10 7 10" />
  <Path d="M3.51 15a9 9 0 1 0 .49-3.29" />
</>);

export const BuildingIcon = withIcon(<>
  <Rect x="1" y="3" width="15" height="18" />
  <Path d="M16 8h4l3 3v10h-7V8z" />
  <Line x1="5" y1="8" x2="5" y2="8.01" />
  <Line x1="5" y1="12" x2="5" y2="12.01" />
  <Line x1="5" y1="16" x2="5" y2="16.01" />
  <Line x1="11" y1="8" x2="11" y2="8.01" />
  <Line x1="11" y1="12" x2="11" y2="12.01" />
  <Line x1="11" y1="16" x2="11" y2="16.01" />
</>);

export const CheckIcon = withIcon(<>
  <Polyline points="20 6 9 17 4 12" />
</>);

export const SendIcon = withIcon(<>
  <Line x1="22" y1="2" x2="11" y2="13" />
  <Polygon points="22 2 15 22 11 13 2 9 22 2" />
</>);

export const ChevronIcon = withIcon(<>
  <Polyline points="9 18 15 12 9 6" />
</>);

export const BackIcon = withIcon(<>
  <Polyline points="15 18 9 12 15 6" />
</>);

export const DownloadIcon = withIcon(<>
  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <Polyline points="7 10 12 15 17 10" />
  <Line x1="12" y1="15" x2="12" y2="3" />
</>);

export const ShareIcon = withIcon(<>
  <Circle cx="18" cy="5" r="3" />
  <Circle cx="6" cy="12" r="3" />
  <Circle cx="18" cy="19" r="3" />
  <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
</>);

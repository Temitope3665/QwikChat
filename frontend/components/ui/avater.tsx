import { getShortName } from "@/lib/utils";

interface AvatarProps {
    value: string;
    color?: string;
}

export default function Avatar({ value, color }: AvatarProps) {
  return (
    <div className='bg-blue-500 w-[45px] h-[45px] flex items-center justify-center rounded-full' style={{backgroundColor: color}}>
      <span className='font-bold text-sm text-white'>{getShortName(value)}</span>
    </div>
  )
}
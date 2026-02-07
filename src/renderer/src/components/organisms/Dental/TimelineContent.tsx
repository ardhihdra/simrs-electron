import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    SnippetsOutlined,
} from '@ant-design/icons';
import { Button, Card } from 'antd';
import type { TimelineContentProps } from '.';
import type { ToothDetail } from './type';

export const TimelineContent = ({
    date,
    treatment,
    condition,
    dentist,
    tooth,
    status,
    notes,
    onEdit,
    setHoveredTeeth,
}: TimelineContentProps & {
    onEdit?: () => void;
    setHoveredTeeth: (teeth: ToothDetail[]) => void;
}) => {
    return (
        <Card
            className="w-full min-w-lg relative"
            onMouseEnter={() => {
                console.log(tooth);
                setHoveredTeeth(tooth);
            }}
            onMouseLeave={() => setHoveredTeeth([])}
        >
            <div className="flex items-center justify-start gap-8 border-b border-b-zinc-300 pb-4 pr-4 mb-4">
                <div>
                    <span className="text-zinc-500 uppercase">
                        {new Date(date.split('-').reverse().join('-')).toLocaleDateString('en-US', {
                            month: 'short',
                        })}
                    </span>
                    <br />
                    <span>{new Date(date.split('-').reverse().join('-')).getDate()}</span>
                </div>
                <div>
                    <span className="text-zinc-500">CONDITION</span>
                    <br />
                    <span>{condition}</span>
                </div>
                <div>
                    <span className="text-zinc-500">TREATMENT</span>
                    <br />
                    <span>{treatment}</span>
                </div>
                <div>
                    <span className="text-zinc-500">DENTISH</span>
                    <br />
                    <span className="font-bold">{dentist}</span>
                </div>
                <div className="ml-auto flex gap-4 items-center">
                    {status === 'done' ? (
                        <div className=" text-green-500">
                            <CheckCircleOutlined /> Done
                        </div>
                    ) : (
                        <div className=" text-yellow-500">
                            <ClockCircleOutlined /> Pending
                        </div>
                    )}
                    <Button type="link" icon={<EditOutlined />} onClick={onEdit}>
                        Edit
                    </Button>
                </div>
            </div>
            <div className="bg-zinc-100 p-4 pl-12 rounded-md relative pb-8">
                <div className="absolute left-4 top-4 text-xl text-zinc-400">
                    <SnippetsOutlined />
                </div>
                <div>
                    <span className="text-zinc-500">Selected Tooth</span>
                    <br />
                    <span>{tooth.map((item) => `${item.id} ${item.type}`).join(', ')}</span>
                    <br />
                    {notes && <span className="text-zinc-500">Notes: {notes}</span>}
                </div>
            </div>
        </Card>
    );
};

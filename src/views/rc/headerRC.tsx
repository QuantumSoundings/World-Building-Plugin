const STATUS = "Status: ";
const RUNNING_TEXT = STATUS + "Running";
const PAUSED_TEXT = STATUS + "Paused";

interface HeaderRCProps {
  paused: boolean;
  currentDate: string;
  dateHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HeaderRC = ({ paused, currentDate, dateHandler }: HeaderRCProps) => {
  return (
    <div>
      <h1>World Engine</h1>
      <h3>
        Current Date:
        <input type="text" style={{ width: "100px" }} value={currentDate} onChange={dateHandler} />
      </h3>
      <h2>{paused ? PAUSED_TEXT : RUNNING_TEXT}</h2>
    </div>
  );
};

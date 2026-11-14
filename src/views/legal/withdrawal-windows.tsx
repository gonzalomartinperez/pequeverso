import { withdrawalCopy, withdrawalWindowList } from "@content/es/legal/withdrawal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table.tsx";

/** Country | plazo table of every configured withdrawal window (legal pages). */
export function WithdrawalWindowsTable() {
  return (
    <>
      <p id="ventanas-arrepentimiento-lead">
        <strong>{withdrawalCopy.windowsLead}</strong>
      </p>
      <Table aria-labelledby="ventanas-arrepentimiento-lead">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{withdrawalCopy.windowsCaption.country}</TableHead>
            <TableHead scope="col">{withdrawalCopy.windowsCaption.period}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawalWindowList.map((window) => (
            <TableRow key={window.country}>
              <TableHead scope="row">{window.country}</TableHead>
              <TableCell>{window.period}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>{withdrawalCopy.windowsNote}</p>
    </>
  );
}

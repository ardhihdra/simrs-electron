/**
 * WaitingSection Component
 *
 * Displays waiting queue tickets grouped by poli + service unit + assurance.
 */

import { Card, Col, Collapse, Empty, Row, Tag } from "antd";
import { QueueTicketCard } from "./QueueTicketCard";
import type { QueueTicket } from "./types";
import { useGroupedTickets } from "./useGroupedTickets";

interface WaitingSectionProps {
  tickets: QueueTicket[];
}

export function WaitingSection({ tickets }: WaitingSectionProps) {
  const waitingTickets = tickets.filter((t) => t.status === "RESERVED");
  const groups = useGroupedTickets(waitingTickets);

  if (waitingTickets.length === 0) {
    return (
      <Card title="Daftar Tunggu">
        <Empty description="Antrian kosong" />
      </Card>
    );
  }

  const collapseItems = groups.map((group) => ({
    key: group.key,
    label: (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: "bold" }}>{group.title}</span>
        <Tag color="blue">{group.tickets.length} antrian</Tag>
      </div>
    ),
    children: (
      <Row gutter={[16, 16]}>
        {group.tickets.map((ticket) => (
          <Col xs={24} sm={12} md={6} lg={4} key={ticket.id}>
            <QueueTicketCard ticket={ticket} />
          </Col>
        ))}
      </Row>
    ),
  }));

  return (
    <Card title="Daftar Tunggu">
      <Collapse
        items={collapseItems}
        defaultActiveKey={groups.map((g) => g.key)}
        style={{ background: "white" }}
      />
    </Card>
  );
}

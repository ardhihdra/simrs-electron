/**
 * QueueTicketCard Component
 *
 * Displays a single queue ticket in a card format.
 */

import { Badge, Card, Tag, Typography } from "antd";
import type { QueueTicket } from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

const { Text } = Typography;

interface QueueTicketCardProps {
  ticket: QueueTicket;
  variant?: "calling" | "waiting";
}

export function QueueTicketCard({
  ticket,
  variant = "waiting",
}: QueueTicketCardProps) {
  const statusColor = STATUS_COLORS[ticket.status] || "default";
  const statusLabel = STATUS_LABELS[ticket.status] || ticket.status;

  // Build title: Poli • ServiceUnit • Assurance
  const title = [
    ticket.poli?.name,
    ticket.serviceUnit?.display,
    ticket.assurance?.display || "Umum",
  ]
    .filter(Boolean)
    .join(" • ");

  if (variant === "calling") {
    return (
      <Card
        hoverable
        style={{
          textAlign: "center",
          borderColor: "#52c41a",
          borderWidth: 2,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {title}
        </Text>
        <div
          style={{ fontSize: "3rem", fontWeight: "bold", color: "#3f8600" }}
        >
          {ticket.queueNumber}
        </div>
        <Tag color="green">DIPANGGIL</Tag>
        <div style={{ marginTop: 8 }}>
          <Text strong>{ticket.patient?.name}</Text>
        </div>
      </Card>
    );
  }

  return (
    <Badge.Ribbon text={ticket.queueNumber} color="blue">
      <Card size="small" title={title} styles={{ header: { fontSize: 12 } }}>
        <Text strong>{ticket.patient?.name}</Text>
        <br />
        <Tag color={statusColor}>{statusLabel}</Tag>
      </Card>
    </Badge.Ribbon>
  );
}

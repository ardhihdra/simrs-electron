/**
 * CallingSection Component
 *
 * Displays currently calling queue tickets.
 */

import { Card, Col, Empty, Row } from "antd";
import { QueueTicketCard } from "./QueueTicketCard";
import type { QueueTicket } from "./types";

interface CallingSectionProps {
  tickets: QueueTicket[];
}

export function CallingSection({ tickets }: CallingSectionProps) {
  const callingTickets = tickets.filter((t) => t.status === "CHECKED_IN");

  return (
    <Card
      title="Sedang Dipanggil"
      style={{ marginBottom: 24, backgroundColor: "#f6ffed" }}
    >
      <Row gutter={[16, 16]}>
        {callingTickets.length > 0 ? (
          callingTickets.map((ticket) => (
            <Col xs={24} sm={12} md={8} lg={6} key={ticket.id}>
              <QueueTicketCard ticket={ticket} variant="calling" />
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Empty
              description="Tidak ada panggilan aktif"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
}

import { Card, Col, Form, Input, Radio, Row } from 'antd'
import React from 'react'

export const ScreeningSection: React.FC = () => {
  return (
    <Card title="Pemeriksaan & Skrining" className="py-4">
      <div className="mb-6">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label="Kesadaran" name="consciousness_level">
              <Radio.Group>
                <Radio value="Sadar">Sadar</Radio>
                <Radio value="Tampak Mengantuk">Tampak Mengantuk</Radio>
                <Radio value="Tidak Sadar">Tidak Sadar</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Pernapasan" name="breathing_status">
              <Radio.Group>
                <Radio value="Normal">Nafas Normal</Radio>
                <Radio value="Sesak">Nafas Sesak</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div className="py-6 border-t border-white/10">
        <Row gutter={24}>
          <Col span={6}>
            <h4 className="font-semibold text-base">Risiko Jatuh</h4>
            <span className="text-sm text-gray-500 block mt-1">(Get Up and Go Test)</span>
          </Col>
          <Col span={18}>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="a. Cara berjalan pasien saat akan duduk di kursi (Tampak semponyongan/limbung?)"
                  name="get_up_go_a"
                >
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="b. Memegang pinggiran kursi/meja/benda lain saat akan duduk?"
                  name="get_up_go_b"
                >
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
      <div className="py-6 border-t border-gray-100">
        <Row gutter={24}>
          <Col span={6}>
            <h4 className="font-semibold text-base">Skrining Nyeri</h4>
          </Col>
          <Col span={18}>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item label="Nyeri Dada?" name="chest_pain_check">
                  <Radio.Group>
                    <Radio value="Tidak">Tidak</Radio>
                    <Radio value="Ada">Ada (Skala sedang, nyeri dada tembus punggung)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Skala Nyeri (Wong-Baker)"
                  name="pain_scale_score"
                  className="mb-8"
                >
                  <Radio.Group className="w-full">
                    <div className="flex w-full gap-2 overflow-x-auto pb-2">
                      {/* 0-1: No Pain */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="flex w-full h-10 mb-2">
                          <div className="flex-1 bg-emerald-300 rounded-tl-lg"></div>
                          <div className="flex-1 bg-emerald-500 rounded-tr-lg"></div>
                        </div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          😃
                        </div>
                        <div className="text-xs text-green-600 font-bold text-center mb-2">
                          No Pain
                        </div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={0} className="mr-0">
                            <span className="font-semibold text-lg">0</span>
                          </Radio>
                          <Radio value={1} className="mr-0">
                            <span className="font-semibold text-lg">1</span>
                          </Radio>
                        </div>
                      </div>

                      {/* 2-3: Mild */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="flex w-full h-10 mb-2">
                          <div className="flex-1 bg-lime-300 rounded-tl-lg"></div>
                          <div className="flex-1 bg-lime-500 rounded-tr-lg"></div>
                        </div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          🙂
                        </div>
                        <div className="text-xs text-lime-600 font-bold text-center mb-2">Mild</div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={2} className="mr-0">
                            <span className="font-semibold text-lg">2</span>
                          </Radio>
                          <Radio value={3} className="mr-0">
                            <span className="font-semibold text-lg">3</span>
                          </Radio>
                        </div>
                      </div>

                      {/* 4-5: Moderate */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="flex w-full h-10 mb-2">
                          <div className="flex-1 bg-yellow-300 rounded-tl-lg"></div>
                          <div className="flex-1 bg-yellow-500 rounded-tr-lg"></div>
                        </div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          😐
                        </div>
                        <div className="text-xs text-yellow-600 font-bold text-center mb-2">
                          Moderate
                        </div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={4} className="mr-0">
                            <span className="font-semibold text-lg">4</span>
                          </Radio>
                          <Radio value={5} className="mr-0">
                            <span className="font-semibold text-lg">5</span>
                          </Radio>
                        </div>
                      </div>

                      {/* 6-7: Severe */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="flex w-full h-10 mb-2">
                          <div className="flex-1 bg-orange-300 rounded-tl-lg"></div>
                          <div className="flex-1 bg-orange-500 rounded-tr-lg"></div>
                        </div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          🙁
                        </div>
                        <div className="text-xs text-orange-600 font-bold text-center mb-2">
                          Severe
                        </div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={6} className="mr-0">
                            <span className="font-semibold text-lg">6</span>
                          </Radio>
                          <Radio value={7} className="mr-0">
                            <span className="font-semibold text-lg">7</span>
                          </Radio>
                        </div>
                      </div>

                      {/* 8-9: Very Severe */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="flex w-full h-10 mb-2">
                          <div className="flex-1 bg-red-400 rounded-tl-lg"></div>
                          <div className="flex-1 bg-red-600 rounded-tr-lg"></div>
                        </div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          😩
                        </div>
                        <div className="text-xs text-red-600 font-bold text-center mb-2">
                          Very Severe
                        </div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={8} className="mr-0">
                            <span className="font-semibold text-lg">8</span>
                          </Radio>
                          <Radio value={9} className="mr-0">
                            <span className="font-semibold text-lg">9</span>
                          </Radio>
                        </div>
                      </div>

                      {/* 10: Worst */}
                      <div className="flex flex-col items-center flex-1 bg-gray-50 rounded-lg pb-2 relative overflow-hidden border border-gray-100">
                        <div className="w-full h-10 bg-red-800 mb-2 rounded-t-lg"></div>
                        <div className="text-7xl grayscale hover:grayscale-0 transition-all cursor-pointer mb-1 transform hover:scale-110 duration-200">
                          😫
                        </div>
                        <div className="text-xs text-red-800 font-bold text-center mb-2">Worst</div>
                        <div className="flex gap-4 justify-center w-full">
                          <Radio value={10} className="mr-0">
                            <span className="font-semibold text-lg">10</span>
                          </Radio>
                        </div>
                      </div>
                    </div>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Lokasi & Karakteristik Nyeri" name="pain_notes">
                  <Input placeholder="Lokasi, durasi, frekuensi, sifat nyeri..." />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      <div className="py-6 border-t border-white/10">
        <Row gutter={24}>
          <Col span={6}>
            <h4 className="font-semibold text-base">Skrining Batuk</h4>
          </Col>
          <Col span={18}>
            <Form.Item name="cough_screening_status">
              <Radio.Group>
                <Radio value="Tidak Ada">Tidak Ada</Radio>
                <Radio value="< 2 Minggu">Batuk &lt; 2 Minggu</Radio>
                <Radio value="> 2 Minggu">Batuk &gt; 2 Minggu</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </Card>
  )
}

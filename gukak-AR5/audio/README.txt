사운드 미납품 상태. js/config.js 의 window.AR5_SFX 에 예약해 둔 파일명 그대로 넣으면
코드 수정 없이 바로 재생된다(파일이 없으면 조용히 무시하고 진행).

  narration/title_01.mp3                    타이틀N (HOME)
  ── 260930 납품(들어와 있음): narration/chandol_06, daon_04, exp1_info1~3, exp2_info1~3 ──
  narration/doram_01.mp3 ~ doram_03.mp3     도람N_01~03 (MAIN)
  narration/chandol_01.mp3 ~ chandol_05.mp3 찬돌N_01~05 (활동1)
  narration/chandol_06.mp3                  찬돌N_06 (정보1 진입)
  narration/exp1_info1~3.mp3                정보1 책 — 1 정선 / 2 밀양 / 3 진도
  narration/exp2_info1~3.mp3                정보2 책 — 1 메기고 받는 / 2 세마치장단 / 3 아리랑 이야기
  bgm/jajin_arari.mp3                       자진아라리 후렴 — 반복 재생되므로 루프에 맞게 컷
                                            (모심는소리-자진아라리 0:15~0:29)
                                            https://museum.seoul.go.kr/sekm/front/archive/searchView.do?recordId=26158
  bgm/jeongseon.mp3                         정선아리랑 후렴 (정선아리랑-V022205 2:58~3:50)
                                            https://www.gugak.go.kr/ency/topic/view/874
  bgm/miryang.mp3                           밀양아리랑 후렴 (민요(동부) 배우기: 04. 밀양아리랑)
                                            https://youtu.be/tt2UW_NUC3g
  bgm/jindo.mp3                             진도아리랑 후렴 (남도민요 중 진도아리랑 0:12~0:27)
                                            https://www.gugak.go.kr/ency/multimedia/view/video/4568
                                            ※ 지역 후렴은 1회 재생 — 끝나야 다음 캐릭터로 넘어간다
  effects/ceremony.mp3                      세 지역 완료 팝업 세레머니 효과음 (활동1·활동2 공용)
  narration/daon_01.mp3 ~ daon_04.mp3       다온N_01~04 (활동2 안내 / 선택 / 종료 / 정보)
  bgm/exp2_jindo.mp3                        활동2 진도아리랑 — 메기는 소리+받는 소리 (남도민요 중 진도아리랑 2:28~3:05)
                                            https://www.gugak.go.kr/ency/multimedia/view/video/4568
  bgm/exp2_jeongseon.mp3                    활동2 정선아리랑 (정선아리랑-V022205 2:58~3:50)
                                            https://www.gugak.go.kr/ency/topic/view/874
  bgm/exp2_miryang.mp3                      활동2 밀양아리랑 (민요(동부) 배우기: 04. 밀양아리랑)
                                            https://youtu.be/tt2UW_NUC3g
                                            ※ 넣은 뒤 exp2.js 의 hits(터치 글자별 ms)를 실측값으로 바꿔야 한다
                                              — exp2.html?tap 으로 열고 노래에 맞춰 달을 누르면 콘솔에 시각이 찍힌다
  effects/click.mp3, effects/hover.mp3      버튼 클릭 / 호버 (현재 AR2 것 복사본)

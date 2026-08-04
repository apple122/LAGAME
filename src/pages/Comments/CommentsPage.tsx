import styled from 'styled-components'
import CommentSection from '../../components/CommentSection/CommentSection'

const Page = styled.div`max-width: 860px; margin: 0 auto; padding: 40px 24px;`

const Hero = styled.div`
  text-align: center; margin-bottom: 48px;
`

const Title = styled.h1`
  font-family: 'Outfit', sans-serif; font-size: 36px; font-weight: 800; color: #fff;
  margin: 0 0 12px 0;
`

const Sub = styled.p`
  color: rgba(148,163,184,0.7); font-size: 15px; margin: 0;
`

export default function CommentsPage() {
  return (
    <Page>
      <Hero>
        <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
        <Title>Guestbook</Title>
        <Sub>ฝากข้อความ ความคิดเห็น หรือข้อเสนอแนะถึงเว็บเราได้เลยครับ!</Sub>
      </Hero>
      <CommentSection type="website" />
    </Page>
  )
}

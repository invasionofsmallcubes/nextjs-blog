import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Hello, my name is Emanuele Ianni and I try to be build stuff people use.</p>
        <p>My GitHub repository is located <a href="https://github.com/invasionofsmallcubes">here</a></p>
        <p>My LinkedIn page is located <a href="https://www.linkedin.com/in/emanueleianni">here</a></p>
        <p>My Twitter handler is <a href="https://twitter.com/IsTDDDeadYet">IsTDDDeadYet</a></p>
        <p>My Twitch handler is <a href="https://www.twitch.tv/theinvasionofsmallcubes">theinvasionofsmallcubes</a></p>
      </section>
    </Layout>
  )
}

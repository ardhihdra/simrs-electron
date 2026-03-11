import z from "zod";
import { t } from "..";

export const mmoduleRpc = {
    my: t.input(z.any()).output(z.object({
        success:z.boolean(),
        result:z.array(z.string()).optional()
    })).query(async ({ client }) => {
        const data = await client.get('/api/module/my')
        const result = await data.json()
        return result
    })
}